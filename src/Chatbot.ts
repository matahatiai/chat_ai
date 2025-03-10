require('dotenv').config()

import { CorpusObject, NlpUtils, NodeNlp } from "./interfaces"

import path from "path"
import { EntitiesManager, Filesystem, SentimentManager } from "./manager"
import { readFile } from "./transform-callback/fs"

// @ts-ignore
import { ConversationContext, NlpManager } from 'node-nlp'
// @ts-ignore
import nlpUtils from '@nlpjs/utils'
const NlpUtils: NlpUtils = nlpUtils

interface ChatbotOptions {
	modelpath: string;
	language: string;
}



const context = new ConversationContext();
export class Chatbot {
	modelpath: string
	entities: EntitiesManager
	sentiment: SentimentManager
	manager: NodeNlp.NlpManager
	filesystem: Filesystem
	language: string

	constructor(opts: ChatbotOptions) {
		this.modelpath = opts.modelpath
		this.language = opts.language
		this.manager = new NlpManager({
			languages: [this.language],
			forceNER: true,
			spellCheck: true,
			modelFileName: this.modelpath,
			nlu: {
				log: false,
				spellCheck: true,
				useNoneFeature: true,
				trainByDomain: false
			},
			ner: {
				threshold: 1
			}
		});
		this.entities = new EntitiesManager(this.language, this.manager)
		this.sentiment = new SentimentManager(this.language, this.manager)
		this.filesystem = new Filesystem()
	}

	addEntityMeta = async (filepath: string ) => {
		let data: any = await readFile(path.join(__dirname, '../', filepath));
		let jsonData = JSON.parse(data.toString());
		for(const i of jsonData){
			this.manager.addNamedEntityText('ticket', i.id, ['id'], [`${i.id}`]);
		}
	}

	corpusByFile = async (filepath: string) => {
		let data: any = await readFile(path.join(__dirname, '../', filepath))
		let file = JSON.parse(data.toString())
		let corpus: CorpusObject[] = file
		return corpus.map(data => {
			if (data.intent !== 'None') {
				let composed: string[] = []
				data.utterances.forEach(composeUtterance => {
					let nlputils = NlpUtils.composeFromPattern(composeUtterance).map(utterance => {
						this.manager.addDocument(this.language, utterance, data.intent)
						return utterance
					})
					composed = [...composed, ...nlputils]
				});
				data.utterances = Array.from(new Set(composed))
				data.answers = data.answers.map(answer => {
					this.manager.addAnswer(this.language, data.intent, answer)
					return answer
				});
			} else {
				data.answers = data.answers.map(answer => {
					this.manager.addAnswer(this.language, "None", answer)
					return answer
				});
			}

			return data
		});
	}

	corpusByDir = async (folderpath: string) => {
		let files: string[] = await this.filesystem.getFiles(folderpath)
		return await Promise.all(files.map(async file => await this.corpusByFile(file)))
	}


	process = async (utterance: string) => {
		return await this.manager.process(this.language, utterance, context)
	}
}