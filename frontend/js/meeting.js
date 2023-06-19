import { ZoomMtg } from "@zoomus/websdk";
import ZoomVideo from '@zoom/videosdk'
import { startCase } from "lodash";
const client = ZoomVideo.createClient();
const KJUR = require('jsrsasign')
const axios = require('axios')
const testTool = window.testTool;
client.init('en-US', `CDN`)

var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

var recognition = new SpeechRecognition();

recognition.continuous = true

// get meeting args from url
const tmpArgs = testTool.parseQuery();
// declare audio initialization state
const meetingConfig = {
  sdkKey: tmpArgs.sdkKey,
  meetingNumber: tmpArgs.mn,
  userName: (function () {
    if (tmpArgs.name) {
      try {
        return testTool.b64DecodeUnicode(tmpArgs.name);
      } catch (e) {
        return tmpArgs.name;
      }
    }
    return (
      "CDN#" +
      tmpArgs.version +
      "#" +
      testTool.detectOS() +
      "#" +
      testTool.getBrowserInfo()
    );
  })(),
  passWord: tmpArgs.pwd,
  leaveUrl: "/index.html",
  role: parseInt(tmpArgs.role, 10),
  userEmail: (function () {
    try {
      return testTool.b64DecodeUnicode(tmpArgs.email);
    } catch (e) {
      return tmpArgs.email;
    }
  })(),
  lang: tmpArgs.lang,
  signature: tmpArgs.signature || "",
  china: tmpArgs.china === "1",
};

console.log(JSON.stringify(ZoomMtg.checkSystemRequirements()));

function generateSignature(sdkKey, sdkSecret, sessionName, role, sessionKey, userIdentity) {

  const iat = Math.round(new Date().getTime() / 1000)
  const exp = iat + 60 * 60 * 2
  const oHeader = { alg: 'HS256', typ: 'JWT' }

  const oPayload = {
    app_key: sdkKey,
    tpc: sessionName,
    role_type: role,
    session_key: sessionKey,
    user_identity: userIdentity,
    version: 1,
    iat: iat,
    exp: exp
  }

  const sHeader = JSON.stringify(oHeader)
  const sPayload = JSON.stringify(oPayload)
  const sdkJWT = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, sdkSecret)
  return sdkJWT;
}
const CLIENT_ID = "_ZKtDTNNSLGHTdiJXOEHrg";
const CLIENT_SECRET = "72fXelTdqrLnvndJ1wz28CAyXsDhNhUo";
const sSig = generateSignature(CLIENT_ID, CLIENT_SECRET, 'Trial', 0, 'session123', 'user123');
// console.log("sig= " + sSig);


// it's option if you want to change the WebSDK dependency link resources. setZoomJSLib must be run at first
ZoomMtg.preLoadWasm();
ZoomMtg.prepareWebSDK();
function beginJoin(signature) {
  ZoomMtg.init({
    leaveUrl: meetingConfig.leaveUrl,
    disableCORP: !window.crossOriginIsolated, // default true
    // disablePreview: false, // default false
    externalLinkPage: './externalLinkPage.html',
    success: function () {
      ZoomMtg.i18n.load(meetingConfig.lang);
      ZoomMtg.i18n.reload(meetingConfig.lang);
      ZoomMtg.showJoinAudioFunction({
        show: true
      });
      ZoomMtg.join({
        meetingNumber: meetingConfig.meetingNumber,
        userName: meetingConfig.userName,
        signature: signature,
        sdkKey: meetingConfig.sdkKey,
        userEmail: meetingConfig.userEmail,
        passWord: meetingConfig.passWord,
        success: function (res) {
          console.log("join meeting success");
          console.log("get attendeelist");
          ZoomMtg.getAttendeeslist({});
          ZoomMtg.getCurrentUser({
            success: function (res) {
              console.log("success getCurrentUser", res.result.currentUser);
            },
          });
          recognition.start();
        },
        error: function (res) {
          console.log(res);
        },
      });

    },
    error: function (res) {
      console.log(res);
    },
  });

  ZoomMtg.inMeetingServiceListener('onUserJoin', function (data) {
    console.log('inMeetingServiceListener onUserJoin', data);
  });

  ZoomMtg.inMeetingServiceListener('onUserLeave', function (data) {
    console.log('inMeetingServiceListener onUserLeave', data);
  });

  ZoomMtg.inMeetingServiceListener('onUserIsInWaitingRoom', function (data) {
    console.log('inMeetingServiceListener onUserIsInWaitingRoom', data);
  });

  ZoomMtg.inMeetingServiceListener('onMeetingStatus', function (data) {
    console.log('inMeetingServiceListener onMeetingStatus', data);
  });

}
beginJoin(meetingConfig.signature);
// var topic = "Meeting", token = sSig, userName = meetingConfig.userName, password = meetingConfig.passWord;

// client.join(topic, token, userName, password).then(() => {
//   stream = client.getMediaStream()
//   console.log(stream);
// }).catch((error) => {
//   console.log(error)
// })


var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

var recognition = new SpeechRecognition();

recognition.continuous = true

recognition.onstart = () => {
  console.log("voice started");
}
recognition.onspeechend = () => {
  console.log("no act");
}
recognition.onerror = () => {
  console.log("error...");
}
recognition.onresult = (event) => {
  var current = event.resultIndex;
  var transcript = event.results[current][0].transcript;
  const formData = {
    'data': transcript
  }
  axios.post('https://zoom-bot-backend.vercel.app/openAI_GPT', formData).then((res) => {
    // console.log("done sending ", res);
    // console.log("the GPT ans= ", res.data);
    // const utteracnce= new SpeechSynthesisUtterance();
    const synth = window.speechSynthesis
    const utterThis = new SpeechSynthesisUtterance(res.data);
    synth.speak(utterThis)
  }).catch(error => console.log(error));
}