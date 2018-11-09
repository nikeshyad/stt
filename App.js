import React, {Component} from 'react';
import {Image, Platform, StyleSheet, Text, View, TouchableHighlight, PermissionsAndroid, AppRegistry, TouchableOpacity} from 'react-native';
import {AudioRecorder, AudioUtils} from 'react-native-audio';
const Sound = require('react-native-sound');
var RNFS = require('react-native-fs');
console.disableYellowBox = true

//set this to true to not send requests to google api
DEBUG_MODE = false;

let audioPath = AudioUtils.DocumentDirectoryPath + '/test.flac';

// The audio file's encoding, sample rate in hertz, and BCP-47 language code
const encoding = "FLAC";
const sampleRateHertz = 16000;
const languageCode = "en-US";

const request = {
  config: {
    encoding: encoding,
    // sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
    speechContexts: [{
      phrases: ["Donart"]
     }]
  },
  interimResults: false, // If you want interim results, set this to true
  single_utterance: true
};

AudioRecorder.prepareRecordingAtPath(audioPath, {
  //SampleRate: sampleRateHertz,
  Channels: 1,
  AudioQuality: "Low",
  AudioEncoding: "flac"
});


const mappingFunction = result => result.alternatives[0].transcript;

type Props = {};
export default class App extends Component<Props> {
 state = {
      currentTime: 0.0,
      recording: false,
      paused: false,
      stoppedRecording: false,
      finished: false,
      audioPath: audioPath,
      hasPermission: undefined,
      transcription: "",
      timer: 0,
      color: 'white',
    };

    prepareRecordingPath(audioPath){
      AudioRecorder.prepareRecordingAtPath(audioPath, {
        //SampleRate: 32000,
        Channels: 1,
        AudioQuality: "Low",
        AudioEncoding: "flac",
      });
    }

    componentWillMount() {

    }

    componentDidMount() {
      AudioRecorder.requestAuthorization().then((isAuthorised) => {
        this.setState({ hasPermission: isAuthorised });

        if (!isAuthorised) return;

        this.prepareRecordingPath(this.state.audioPath);

        AudioRecorder.onProgress = (data) => {
          this.setState({currentTime: Math.floor(data.currentTime)});
        };

        AudioRecorder.onFinished = (data) => {
          // Android callback comes in the form of a promise instead.
          if (Platform.OS === 'ios') {
            this._finishRecording(data.status === "OK", data.audioFileURL, data.audioFileSize);
          }
        };
      });
    }

    _renderButton(title, onPressIn, onPressOut) {
      return (
        <TouchableOpacity onPressIn={onPressIn} onPressOut={onPressOut}>
          <Image style={{width: 200, height: 200}}
            source={require('./icon.png')}
          />
        </TouchableOpacity>
      );
    }

    async _stop() {
      //console.warn("stopping")
      if (!this.state.recording) {
        console.warn('Can\'t stop, not recording!');
        return;
      }

      this.setState({stoppedRecording: true, recording: false, paused: false});

      try {
        const filePath = await AudioRecorder.stopRecording();

        if (Platform.OS === 'android') {
          this._finishRecording(true, filePath);
        }
        return filePath;
      } catch (error) {
        console.error(error);
      }
    }

    async _play() {  
      //console.warn("playing")  
      clearInterval(this.interval); 
      this.setState({timer: 0, color: 'white'})
      if (this.state.recording) {
        await this._stop();
      }

      //Uncomment this block to play sound
      /***********************************
      setTimeout(() => {
        var sound = new Sound(this.state.audioPath, '', (error) => {
          if (error) {
            console.log('failed to load the sound', error);
          }
        });

        setTimeout(() => {
          sound.play((success) => {
            if (success) {
              console.log('successfully finished playing');
            } else {
              console.log('playback failed due to audio decoding errors');
            }
          });
        }, 100);
      }, 100);
    ************************************/
    this._getSpeech();
    }

    async _record() {
      this.interval = setInterval(
      () => this.setState({timer: ++this.state.timer}),
      1000
      );
      // '#bdbdbd' or '#d9f4f4'?? sets background color when button is being pressed
      this.setState({color: '#d9f4f4'});
      if (DEBUG_MODE) {
        return
      }
      //console.warn("recording")
      if (this.state.recording) {
        console.warn('Already recording!');
        return;
      }

      if (!this.state.hasPermission) {
        console.warn('Can\'t record, no permission granted!');
        return;
      }

      if(this.state.stoppedRecording){
        this.prepareRecordingPath(this.state.audioPath);
      }

      this.setState({recording: true, paused: false});

      try {
        const filePath = await AudioRecorder.startRecording();
      } catch (error) {
        console.error(error);
      }
    }

    _finishRecording(didSucceed, filePath, fileSize) {
      this.setState({ finished: didSucceed });
      console.log(`Finished recording of duration ${this.state.currentTime} seconds at path: ${filePath} and size of ${fileSize || 0} bytes`);
      this.state.audioPath = filePath;
    }

    async _getSpeech() {
      // Reads a local audio file and converts it to base64
      const file = await RNFS.readFile(this.state.audioPath, 'base64')
      .then(function(result){
        return result
      })
    //console.warn(this.state.audioPath)

      try {
        // Call Google API
        const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key= ***** api key ***`, {
          method: 'POST',
          body: JSON.stringify({
            "config": request.config,
            "audio": {
              "content": file,
            },
          }),
        })
        .then(response => response.json())
        .then(data => {
          trans = data.results[0].alternatives[0].transcript;
          this.setState({transcription: trans});
        })
        .catch(function(err) {
            console.log(err);
          })
      } catch (error) {
        console.error(error);
      }; 
      //this.componentWillMount()
    }

    render() {
      return (
        <View style={{flex:1, backgroundColor: this.state.color}}>
          <View style={styles.controls}>
            <Text style={styles.text}>{this.state.timer}</Text>
            {this._renderButton("Record", () => {this._record()}, () => {this._play()})}
            <Text style={styles.text}>{this.state.transcription}</Text> 
          </View>
        </View>
      );
    }
  }

 var styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'white',
    },
    controls: {
      paddingTop: 100,
      alignItems: 'center',
      flex: 1,
    },
    text: {
      fontSize: 30,
      color: 'red',
      paddingTop: 50,
      paddingBottom: 20,
    }
  });

 AppRegistry.registerComponent('SpeechToText', () => App);
