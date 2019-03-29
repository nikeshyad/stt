import React, {Component} from 'react';
import {TextInput, Picker, Button, Image, Platform, StyleSheet, Text, View, TouchableHighlight, PermissionsAndroid, AppRegistry, TouchableOpacity, ImageBackground, Dimensions} from 'react-native';
import {AudioRecorder, AudioUtils} from 'react-native-audio';
import Tts from 'react-native-tts';
import RNRestart from 'react-native-restart';

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
    languageCode: 'en-US',
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
      timer: '',
      color: 'white',
      alpha: '',
      beta: '',
      result: '',
      rand: '',
      ops: ['+', '-', 'x'],
      language: 'en-US',
      opacity: 1,
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
      //Tts.setDefaultRate(0.45);
      //Tts.speak('2 plus 2 = ', { iosVoiceId: 'com.apple.ttsbundle.Karen-compact'});
      this.setState({
        alpha: Math.floor(Math.random() * 13), 
        beta: Math.floor(Math.random() * 13), 
        lang: 'English',
        rand: Math.floor(Math.random() * 3),
        timer: 5,
       });

      Tts.setDefaultLanguage(this.state.language);
    }


    // componentDidUpdate() {
    //   if (this.state.timer == 0) {
    //     this.checkAns();
    //     this.setState({timer:1000})
    //   }
    // }

    componentDidMount() {
      var operation;

      if (this.state.ops[this.state.rand] == '+') {
        operation = 'plus'
      } else if (this.state.ops[this.state.rand] == '-') {
        operation = 'minus'
      } else if (this.state.ops[this.state.rand] == 'x') {
        operation = 'times'
      }

      Tts.speak(String(this.state.alpha) + operation + String(this.state.beta));


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
          <Image style={{width: 100, height: 100}}
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

    checkAns = () => {
        var onCorrectArray = ['Yay!', 'Nice!', 'Congratulations!', 'You get the koosh koosh', 'Hamby'];
        var onWrongArray = ['You failed your family, country and yourself!', 'Hamby is disappointed', 'Not Quite!', 'Try Again!', 'Good Effort!', 'Almost Got It!']

        var onCorrect = onCorrectArray[Math.floor(Math.random() * onCorrectArray.length)];
        var onWrong = onWrongArray[Math.floor(Math.random() * onWrongArray.length)];

        if (this.state.rand == 0 && this.state.alpha + this.state.beta == this.state.transcription) {
          this.setState({result: onCorrect}); 
          Tts.speak(onCorrect, )

        } else if (this.state.rand == 1 && this.state.alpha - this.state.beta == this.state.transcription) {
          this.setState({result: onCorrect}); 
          Tts.speak(onCorrect)

        } else if (this.state.rand == 2 && this.state.alpha * this.state.beta == this.state.transcription) {
          this.setState({result: onCorrect}); 
          Tts.speak(onCorrect)

        } else if (this.state.rand == 0 && this.state.alpha + this.state.beta != this.state.transcription) {
          this.setState({result: onWrong}); 
          Tts.speak(onWrong)

        } else if (this.state.rand == 1 && this.state.alpha - this.state.beta != this.state.transcription) {
          this.setState({result: onWrong}); 
          Tts.speak(onWrong)

        } else if (this.state.rand == 2 && this.state.alpha * this.state.beta != this.state.transcription) {
          this.setState({result: onWrong});
          Tts.speak(onWrong)
        } 

    }

    async _play() {  
      //console.warn("playing")  
      clearInterval(this.interval); 
      this.setState({timer: 0, opacity: 1})
      if (this.state.recording) {
        await this._stop();
      }

      // this.interval = setInterval(
      // () => this.setState({timer: --this.state.timer}),
      // 1000
      // );

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
    //this.checkAns();



    }

    async _record() {
      this.interval = setInterval(
      () => this.setState({timer: ++this.state.timer}),
      1000
      );
      // '#bdbdbd' or '#d9f4f4'?? sets background color when button is being pressed
      this.setState({opacity: 0.5});
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
        request.config.languageCode =  this.state.language
        // Replace key with actual key provided by Google
        const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=****`, {
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
          trans = parseInt(trans);
          this.setState({transcription: trans});
        })
        .catch(function(err) {
            console.log(err);
          })
      } catch (error) {
        console.error(error);
      }; 
      
    }

    render() {
      return (
        <View style={{flex:1, backgroundColor: this.state.color}}>
        <ImageBackground source={require('./backGround.jpg')}
          style={{opacity: this.state.opacity, width: Dimensions.get('window').width, height: Dimensions.get('window').height}}>
          <View style={styles.controls}>
            <Text style={styles.intBox}>{this.state.alpha + " " + this.state.ops[this.state.rand] + " " + this.state.beta}</Text>
            <Text></Text>
            {this._renderButton("Record", () => {this._record()}, () => {this._play()})}
            <Text style={styles.text}>{this.state.transcription}</Text> 

            <TextInput
              style={{opacity:0, fontSize:30, width: 130}}
              placeholder="Type here"
              onChangeText={(text) => this.setState({transcription: text})}
            />

            <TouchableOpacity onPress={this.checkAns}> 
              <Text style={styles.checkB}>
                Check 
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={{padding: 10}} onPress={() => RNRestart.Restart()}> 
              <Image style={{width: 200, height: 50}}
                source={require('./next.png')}
              />
            </TouchableOpacity>
            <Picker
              selectedValue={this.state.language}
              style={{fontSize: 30, width: 100 }}
              onValueChange={(itemValue, itemIndex) => this.setState({language: itemValue})}>
              <Picker.Item label="English" value="en-US" />
              <Picker.Item label="Nepali" value="ne-NP" />
              <Picker.Item label="Spanish" value="es-ES" />
              <Picker.Item label="French" value="fr-FR" />
              <Picker.Item label="Chinese" value="cmn-Hans-CN" />
              <Picker.Item label="Arabic" value="ar-EG" />
              <Picker.Item label="Thai" value="th-TH" />
              <Picker.Item label="German" value="de-DE" />
              <Picker.Item label="Ghana-English" value="en-GH" />
              <Picker.Item label="Russian" value="ru-RU" />
            </Picker>

          </View>
          </ImageBackground>
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
    },
    intBox: {
      width: 200,
      height: 70,
      textAlign: 'center',
      fontSize: 60,
      fontWeight: 'bold',
    },
    checkB: {
      width: 200,
      height: 45,
      textAlign: 'center',
      fontSize: 35,
      fontWeight: 'bold',
    },

  });

 AppRegistry.registerComponent('SpeechToText', () => App);
