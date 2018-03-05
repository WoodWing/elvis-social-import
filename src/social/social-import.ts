import { Config } from '../config';
import { ElvisApi, HitElement, SearchResponse } from '../elvis-api/api';
import { ApiManager } from '../elvis-api/api-manager';
import Twitter = require('twitter');
import request = require('request');
import path = require('path');
import hashFile = require('hash_file');
import { TopicConfig } from './topic-config';
import { Topic } from './topic';

export class SocialImport {

  private twitterClient: Twitter;
  private elvisApi: ElvisApi = ApiManager.getApi();
  private topicConfig:TopicConfig;
  
  constructor() {
    this.init();
  }

  private async init() {
    let args = {
      consumer_key: Config.twitterConsumerKey,
      consumer_secret: Config.twitterConsumerSecret,
      access_token_key: Config.twitterAccessTokenKey,
      access_token_secret: Config.twitterAccessTokenSecret
    }
    this.twitterClient = new Twitter(args);
    this.topicConfig = await TopicConfig.getTopicConfig();
    if (this.topicConfig.topics.length == 0) {
      this.topicConfig.addTopic(new Topic('Oscars', ['Oscars2018', 'Oscars', 'Oscar', 'Oscars90']));
      this.topicConfig.addTopic(new Topic('Golden Globes', ['GoldenGlobes', 'GoldenGlobes2018', 'Globes2018', 'GG2018', 'goldenglobe']));
      this.topicConfig.addTopic(new Topic('Storm Emma', ['StormEmma', 'BeastFromTheEast']));
    }
    this.searchTwitter();
  }

  private searchTwitter():void {
    let searchFor:string = this.topicConfig.allKeywords.join(',');
    this.twitterClient.stream('statuses/filter', {track: searchFor}, (stream) => {
      stream.on('data', (tweet) => {
        this.downloadTweetMedia(tweet);
      });
      stream.on('error', (error) => {
        console.log(error);
      });
    });
  }

  private async downloadTweetMedia(tweet:any):Promise<void> {
    if (tweet.entities && tweet.entities.media && !tweet.retweeted_status) {
      let media = tweet.entities.media;
      let foundKeyword:string = this.topicConfig.findKeyword(tweet.text);
      media.forEach(async mediaItem => {
        console.log('Found a ' + mediaItem.type + ' searching for "' + foundKeyword + '". Tweet url: ' + mediaItem.url + ' Tweet ' + mediaItem.type + ': ' +  mediaItem.media_url_https);
        let buffer:Buffer = await this.downloadFile(mediaItem.media_url_https);
        let alreadyInElvis:boolean = await this.isFileAlreadyInElvis(buffer);
        if (!alreadyInElvis) {
          let metadata = this.getElvisMetadata(tweet, mediaItem, foundKeyword);
          let hit:HitElement = await this.elvisApi.create(buffer, JSON.stringify(metadata));
          console.log('Downloaded and imported: ' + hit.metadata.assetPath);
        }
      });
    }
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
      tags: [],
      imageCreator: tweet.user.name,
      imageCreatorID: tweet.user.id_str,
      imageCreatorImageID: mediaItem.id_str,
      creatorName: tweet.user.name
    };

    if (tweet.entities.hashtags) {
      metadata['tags'] = tweet.entities.hashtags.map(hashtag => hashtag.text);
    }
    if (!metadata['tags'].includes(foundKeyword)) {
      metadata['tags'].push(foundKeyword);
    }

    let hasExactCoordinates:boolean = (tweet.coordinates && tweet.coordinates.length == 2);

    if (tweet.place) {
      let place:any = tweet.place;
      if (place.place_type === 'city') {
        metadata['shownCity'] = place.name;
      }
      metadata['shownCountryName'] = place.country;
      metadata['shownCountryCode'] = place.country_code;

      let bb:any = place.bounding_box;
       // Use boundingbox coordinates if we don't have exact coordinates and if they exist
      if (!hasExactCoordinates && bb.coordinates && bb.coordinates.length == 1 && bb.coordinates[0].length == 4 && bb.type === 'Polygon') {
        let c:number[] = bb.coordinates[0];
        metadata['gpsLongitude'] = (c[0][0] + c[2][0]) / 2;
        metadata['gpsLatitude'] = (c[0][1] + c[1][1]) / 2;
        console.log('BOUNDING BOX: longitude: ' + metadata['gpsLongitude'] + ' latitude: ' + metadata['gpsLatitude'] + ' sourceId:"' + tweet.id_str + '"');
      }
    }
    if (hasExactCoordinates) {
      metadata['gpsLongitude'] = tweet.coordinates[0];
      metadata['gpsLatitude'] = tweet.coordinates[1];
      console.log('EXACT LOCATION: longitude: ' + metadata['gpsLongitude'] + ' latitude: ' + metadata['gpsLatitude'] + ' sourceId:"' + tweet.id_str + '"');
    }
    
    if (tweet.user.location) {
      metadata['creatorAddress'] = tweet.user.location;
    }
    if (tweet.user.url) {
      metadata['website'] = tweet.user.url;
    }

    return metadata;
  }
}