import { CorpusObject, ENVInterface, NodeNlp } from "./interfaces";
import { Chatbot } from "./Chatbot";

const ENV: ENVInterface = {
    corpus_dir: process.env.PATH_CORPUS_DIR,
    modelpath: process.env.PATH_MODEL
}

let bot = new Chatbot({
    language: "id",
    modelpath: ENV.modelpath
});
(async () => {
    //await bot.manager.load("data.train");

    let files: string[]
    // Load entities
    files = await bot.filesystem.getFiles('dataset/entities/tsv')
    files.forEach(file => bot.entities.loadTsv(file))
    files = await bot.filesystem.getFiles('dataset/entities/json')
    files.forEach(file => bot.entities.loadJson(file))

    // Load sentiment
    files = await bot.filesystem.getFiles('dataset/sentiment/tsv')
    files.forEach(file => bot.sentiment.loadTsv(file))
    files = await bot.filesystem.getFiles('dataset/sentiment/json')
    files.forEach(file => bot.sentiment.loadJson(file))

    console.log(">>Corpus File");
    await bot.corpusByDir(ENV.corpus_dir)
    console.log("Training..")
    await bot.manager.train()
    await bot.manager.save("data.train");
    console.log("Training finished");
})()