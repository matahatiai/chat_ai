import { CorpusObject, ENVInterface, NodeNlp } from "./interfaces";
import { Chatbot } from "./Chatbot";
import express, { Request, Response } from 'express';
import cors from "cors";
import path from "path"
import { readFile } from "./transform-callback/fs"

if (!process.env.PORT) {
	console.log(`No port value specified...`)
}

const PORT = parseInt(process.env.PORT as string, 10);
const app = express();

async function getMeta(filepath: string) {
	let data: any = await readFile(path.join(__dirname, '../', filepath));
	return JSON.parse(data.toString());
}

function find(array: any[], string: any): any[] {
    return array.reduce((r: any[], o: any) => {
        if (Object.values(o).some((v: any) => v === string)) {
            r.push(o);
            return r;
        }
        if (Array.isArray(o.subNames)) {
            var subNames = find(o.subNames, string);
            if (subNames.length) r.push(Object.assign({}, o, { subNames }));
        }
        return r;
    }, []);
}


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const ENV: ENVInterface = {
	corpus_dir: process.env.PATH_CORPUS_DIR,
	modelpath: process.env.PATH_MODEL
}

let bot = new Chatbot({
	language: "id",
	modelpath: ENV.modelpath
});
(async () => {
	await bot.manager.load("data.train");

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
	// console.log("Load corpus by database is OK");
	await bot.addEntityMeta('dataset/storage/NewData.json');
	await bot.corpusByDir(ENV.corpus_dir)
	// console.log("Load corpus Directory is OK");
	// await bot.manager.train()
	// console.log("Training is OK");
	// await bot.manager.save("data.train");
	//const result: NodeNlp.process = await bot.process("Status tiket pizza");
	//console.log(result);
})()

app.get('/', (req: Request, res: Response) => {
	res.status(200).json({
		message: 'Hurray, this is the assistance API',
		success: true,
	});
});

app.post('/conversation', async (req: Request, res: Response) => {
	if (req.body.message) {
		const result: NodeNlp.process = await bot.process(req.body.message.toLowerCase());

		let addMessage = "";
		if(result.entities.length > 0){
			console.log(result.entities);
			if(result.entities[0].entity == 'ticket'){
				let findResult = await find(await getMeta('dataset/storage/NewData.json'), result.entities[0].option);
				addMessage += `\nTiket anda dengan nomor ${result.entities[0].sourceText} berstatus "${findResult[0].ticketStatus}"`
			}
		}
		res.status(200).json({
			message: result.answer+addMessage,
			success: true,
		});
	} else {
		res.status(400).json({
			message: "No key exist",
			success: false,
		});
	}
});

app.listen(PORT, () => {
	console.log(`Server is listening on port ${PORT}`)
});