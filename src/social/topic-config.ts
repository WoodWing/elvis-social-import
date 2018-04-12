import { Topic } from './topic';
import { Config } from '../config';
import * as fs from 'fs';
import { promisify } from 'util';

export class TopicConfig {
  private _topics:Topic[] = [];
  private _topicsByKeyword:Topic[];
  private _allKeywords:string[];
  private _changeHandlers = [];
  
  private readFile = promisify(fs.readFile);
  private writeFile = promisify(fs.writeFile);

  private static instance: TopicConfig;

  public static getInstance(): TopicConfig {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  private constructor() {
  }
  
  public get topics():Topic[] {
    return this._topics;
  }

  public set topics(topics:Topic[]) {
    this._topics = topics;
    this.topicsChangedHandler();
  }

  public get allKeywords():string[] {
    return this._allKeywords;
  }

  public saveTopic(topic:Topic):void {
    let existingTopic:Topic = this.topics.find((t:Topic) => {
      return t.name === topic.name;
    });
    if (existingTopic) {
      // Update existing topic
      existingTopic.keywords = topic.keywords;
    }
    else {
      // Save new topic
      this._topics.push(topic);
    }
    this.topicsChangedHandler();
  }

  public removeTopic(name:string):void {
    this.topics = this.topics.filter((topic:Topic) => {
      return topic.name !== name;
    });
  }
  
  public findKeyword(tweetTxt:string):string {
    let tweetWords:string[] = tweetTxt.toLowerCase().match(/[^\s]+/g);
    let keywordMap = Object.entries(this._topicsByKeyword);
    for (let [keyword, topic] of keywordMap) {
      if(tweetWords.includes(keyword.toLowerCase()) || tweetWords.includes('#' + keyword.toLowerCase())) {
        return topic.name;
      }
    }
    // Not found on exact word match, fallback to partial matching
    for (let [keyword, topic] of keywordMap) {
      if(tweetTxt.toLowerCase().indexOf(keyword) > -1) {
        return topic.name;
      }
    }
    return '';
  }

  public registerChangeHandler(callback:Function, args):void {
    this._changeHandlers.push({
      callback: callback,
      args: args
     });
  }

  public async loadConfig(): Promise<void> {
    try {
      let data = await this.readFile(Config.topicConfigFile, 'utf8')
      this.topics = JSON.parse(data);
    }
    catch(e) {
      if (e.code !== 'ENOENT') {
        throw new Error('Unable to load config file: ' + e);
      }
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      this.writeFile(Config.topicConfigFile, JSON.stringify(this._topics, null, 2));
    }
    catch (e) {
      throw new Error('Unable to save config file: ' + e);
    }
  }

  private topicsChangedHandler():void {
    this.resetLookupArrays();
    this.saveConfig();
    this._changeHandlers.forEach(handler => {
      handler.callback(handler.args);
    });
  }

  private resetLookupArrays():void {
    this._allKeywords = [];
    this._topicsByKeyword = [];
    this._topics.forEach((topic:Topic) => {
      this._allKeywords = this._allKeywords.concat(topic.keywords);
      for (let keyword of topic.keywords) {
        this._topicsByKeyword[keyword] = topic;
      }
    });
  }

}