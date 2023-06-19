const express = require('express');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require("openai")
const axios = require("axios");
const say = require('say')
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.static(path.join(__dirname, "./public")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.json())

app.set("views", path.join(__dirname, "./views"));
app.set("view engine", "ejs");

const configuration = new Configuration({
    organization: process.env.ORG,
    apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(configuration);
var GptResponse = '', speechData = '';

// app.get("/", (req, res) => {
//     say.speak(GptResponse);
//     res.render("index", { GPT_response: GptResponse, newSpeech: speechData });
// })

app.post("/openAI_GPT", async (req, res) => {
    const data = req.body.data;
    // console.log(data);
    try {
        // const res= await axios.get()
        const completion = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: data,
            max_tokens: 3000,
            frequency_penalty: 0,
            presence_penalty: 0,
        })
        var response = completion.data.choices[0].text;
        response = response.replace(/^\s+|\s+$/g, '');
        // console.log("response", response);
        GptResponse = response;
        speechData = data;
        res.status(200).send(response);
        // res.redirect('/');
    } catch (e) {
        console.log("Error has occurred: " + e.message);
        console.log(e)
    }

})

const port = 3000 || process.env.PORT
app.listen(port, () => {
    console.log('listening on port ' + port);
})