import { Config } from '../config';
import { ElvisApi, HitElement, SearchResponse } from '../elvis-api/api';
import { ApiManager } from '../elvis-api/api-manager';
import Twitter = require('twitter');
import request = require('request');
import path = require('path');
import hashFile = require('hash_file');

export class SocialImport {

  private twitterClient: Twitter;
  private elvisApi: ElvisApi = ApiManager.getApi();

  constructor() {
    let args = {
      consumer_key: Config.twitterConsumerKey,
      consumer_secret: Config.twitterConsumerSecret,
      access_token_key: Config.twitterAccessTokenKey,
      access_token_secret: Config.twitterAccessTokenSecret
    }

    this.twitterClient = new Twitter(args);
    let keywords:string[] = ['KatiePrice', 'MeghanMarkle', 'sneeuw', 'trump'];
    this.searchTwitter(keywords);
  }

  private searchTwitter(keywords:string[]):void {
    let searchFor:string = keywords.join(',')
    this.twitterClient.stream('statuses/filter', {track: searchFor},  (stream) => {
      stream.on('data', (tweet) => {
        this.downloadTweetMedia(tweet, keywords);
      });
      stream.on('error', (error) => {
        console.log(error);
      });
    });
  }

  private async downloadTweetMedia(tweet:any, keywords:string[]):Promise<void> {
    if (tweet.entities && tweet.entities.media && !tweet.retweeted_status) {
      let media = tweet.entities.media;
      let foundKeyword:string = this.findKeyword(tweet.text, keywords);
      media.forEach(async mediaItem => {
        console.log('Found a ' + mediaItem.type + ' searching for "' + foundKeyword + '". Tweet url: ' + mediaItem.url + ' Tweet ' + mediaItem.type + ': ' +  mediaItem.media_url_https);
        let buffer:Buffer = await this.downloadFile(mediaItem.media_url_https);
        let alreadyInElvis:boolean = await this.isFileAlreadyInElvis(buffer);
        if (!alreadyInElvis) {
          let metadata = this.getElvisMetadata(tweet, mediaItem, foundKeyword);
          let hit:HitElement = await this.elvisApi.create(buffer, JSON.stringify(metadata));
          console.log('Downloaded and imported: ' + hit.metadata.assetPath);
        }
        else {
          console.log('Skipped import, file already in Elvis: ' + mediaItem.media_url_https);
        }
      });
    }
  }

  private findKeyword(tweetTxt:string, keywords:string[]):string {
    let tweetWords:string[] = tweetTxt.toLowerCase().match(/[^\s]+/g);
    for(let keyword of keywords) {
      if(tweetWords.includes(keyword.toLowerCase()) || tweetWords.includes('#' + keyword.toLowerCase())) {
        return keyword;
      }
    }
    // Not found on exact word match, fallback to partial matching
    for(let keyword of keywords) {
      if(tweetTxt.toLowerCase().indexOf(keyword) > -1) {
        return keyword;
      }
    }
    return '';
  }

  private downloadFile(url:string):Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      request({url:url, encoding:null}, (err, res, buffer) => {
        res = res;
        if (err) {
          return reject(new Error('Unable to download twitter image: ' + err));
        }
        resolve(buffer);
      });
    });
  }

  private async isFileAlreadyInElvis(buffer:Buffer):Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      hashFile(buffer, 'md5', async (error, hash) => {
        if(error) {
          return reject(new Error('File hashing failed: ' + error));
        }
        let q:string = 'firstExtractedChecksum:' + hash;
        let sr:SearchResponse = await this.elvisApi.searchGet(q, 0, 0);
        resolve(sr.totalHits > 0);
      });
    });
  }

  private getElvisMetadata(tweet:any, mediaItem:any, foundKeyword:string):any {
    let filename:string = path.basename(mediaItem.media_url_https);
    
    let metadata = {
      assetPath: '/Demo Zone/Social/Twitter/' + foundKeyword + '/' + filename,
      url: mediaItem.url,
      source: 'Twitter',
      sourceId: tweet.id_str,
      sourceUrl: mediaItem.media_url_https,
      created: tweet.created_at,
      termsAndConditionsURL: 'https://twitter.com/en/tos',
      description: tweet.text,
      tags: []
    };

    if (tweet.entities.hashtags) {
      metadata['tags'] = tweet.entities.hashtags.map(hashtag => hashtag.text);
    }
    if (!metadata['tags'].includes(foundKeyword)) {
      metadata['tags'].push(foundKeyword);
    }

    if (tweet.coordinates && tweet.coordinates.length == 2) {
      metadata['longitude'] = tweet.coordinates[0];
      metadata['latitude'] = tweet.coordinates[1];
    }
        
    return metadata;
  }
}