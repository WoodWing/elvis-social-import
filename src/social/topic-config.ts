import { Topic } from './topic';
import { Config } from '../config';
import * as fs from 'fs';

export class TopicConfig {
  private _topics:Topic[] = [];
  private _topicsByKeyword:Topic[];
  private _allKeywords:string[];
  
  private static instance: TopicConfig;

  public static async getTopicConfig(): Promise<TopicConfig> {
    if (!this.instance) {
      this.instance = new this();
    }
    await this.instance.loadConfig();
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

  public addTopic(topic:Topic):void {
    this._topics.push(topic);
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

  private topicsChangedHandler():void {
    this.resetLookupArrays();
    this.saveConfig();
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

  private async loadConfig(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.readFile(Config.topicConfigFile, 'utf8', (err, data) => {
        if (err) {
          if (err.code === 'ENOENT') {
             resolve();
          }
          else {
             reject('Unable to load config file: ' + err);
          }
        }
        else {
          this.topics = JSON.parse(data);
          resolve();
        }
      });
    });
  }

  private async saveConfig(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.writeFile(Config.topicConfigFile, JSON.stringify(this._topics, null, 2), (err) => {
        if (err) {
          reject('Unable to save config file: ' + err);
        }
        else {
          resolve();
        }
      });
    });
  }
}