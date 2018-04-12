import { Config } from '../config';
import { ElvisApi, HitElement, SearchResponse } from '../elvis-api/api';
import { ApiManager } from '../elvis-api/api-manager';
import Twitter = require('twitter');
import request = require('request');
import path = require('path');
import hashFile = require('hash_file');
import { TopicConfig } from './topic-config';

export class SocialImport {

  private twitterClient: Twitter;
  private twitterStream;
  private elvisApi: ElvisApi = ApiManager.getApi();
  private topicConfig: TopicConfig;

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
    this.topicConfig = TopicConfig.getInstance();
    await this.topicConfig.loadConfig();
    this.searchTwitter();
    // Reset search every X seconds
    setInterval(this.searchTwitter.bind(this), Config.topicRefreshInterval * 1000);
    // Reset search when topics change
    this.topicConfig.registerChangeHandler((self: SocialImport) => {
      self.searchTwitter();
    }, this);
  }

  private searchTwitter(): void {
    if (this.twitterStream) {
      // Destroy existing stream
      this.twitterStream.destroy();
    }

    if (!this.topicConfig.allKeywords || this.topicConfig.allKeywords.length == 0) {
      console.info('Twitter search stopped, there is nothing to search for...');
      return;
    }

    let searchFor: string = this.topicConfig.allKeywords.join(',');
    console.info('New Twitter search started for: ' + searchFor);
    this.twitterClient.stream('statuses/filter', { track: searchFor }, (stream) => {
      this.twitterStream = stream;
      stream.on('data', async (tweet) => {
        try {
          await this.downloadTweetMedia(tweet);
        }
        catch (e) {
          console.error('An error occurred during download of Tweet media: ' + e.stack);
        }
      });
      stream.on('error', (error) => {
        console.info('An error occured connecting to Twitter: ' + error);
      });
    });
  }

  private async downloadTweetMedia(tweet: any): Promise<void> {
    if (tweet.entities && tweet.entities.media && !tweet.retweeted_status) {
      let media = tweet.entities.media;
      let foundKeyword: string = this.topicConfig.findKeyword(this.getTweetText(tweet));
      media.forEach(async mediaItem => {
        console.info('Found a ' + mediaItem.type + ' searching for "' + foundKeyword + '". Tweet url: ' + mediaItem.url + ' Tweet ' + mediaItem.type + ': ' + mediaItem.media_url_https);
        let buffer: Buffer = await this.downloadFile(mediaItem.media_url_https);
        let alreadyInElvis: boolean = await this.isFileAlreadyInElvis(buffer);
        if (!alreadyInElvis) {
          let metadata = this.getElvisMetadata(tweet, mediaItem, foundKeyword);
          let hit: HitElement = await this.elvisApi.create(buffer, JSON.stringify(metadata));
          console.info('Downloaded and imported: ' + hit.metadata.assetPath);
        }
      });
    }
  }

  private downloadFile(url: string): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      request({ url: url, encoding: null }, (err, res, buffer) => {
        res = res;
        if (err) {
          return reject(new Error('Unable to download twitter image: ' + err));
        }
        resolve(buffer);
      });
    });
  }

  private async isFileAlreadyInElvis(buffer: Buffer): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      hashFile(buffer, 'md5', async (error, hash) => {
        if (error) {
          return reject(new Error('File hashing failed: ' + error));
        }
        let q: string = 'firstExtractedChecksum:' + hash;
        let sr: SearchResponse = await this.elvisApi.searchGet(q, 0, 0);
        resolve(sr.totalHits > 0);
      });
    });
  }

  private getTweetText(tweet: any): string {
    return tweet.extended_tweet ? tweet.extended_tweet.full_text : tweet.text;
  }

  private getElvisMetadata(tweet: any, mediaItem: any, foundKeyword: string): any {
    let filename: string = path.basename(mediaItem.media_url_https);

    var tweetUrl = 'https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str;

    let metadata = {
      assetPath: Config.twitterFilesDestination + '/' + foundKeyword + '/' + filename,
      url: mediaItem.url,
      source: 'Twitter',
      sourceId: tweet.id_str,
      sourceUrl: tweetUrl,
      created: tweet.created_at,
      termsAndConditionsURL: 'https://twitter.com/en/tos',
      description: this.getTweetText(tweet),
      tags: [],
      imageCreator: tweet.user.name,
      imageCreatorID: tweet.user.id_str,
      imageCreatorImageID: tweet.user.profile_image_url,
      creatorName: tweet.user.name,
      cf_tweetObject: JSON.stringify(tweet, null, 2),
      cf_tweetUserLocation: tweet.user.location,
      cf_tweetUserDescription: tweet.user.description,
      cf_tweetUserFollowersCount: tweet.user.followers_count,
      cf_tweetUserFriendsCount: tweet.user.friends_count,
      cf_tweetUserListedCount: tweet.user.listed_count,
      cf_tweetUserFavouritesCount: tweet.user.favourites_count,
      cf_tweetUserStatusesCount: tweet.user.statuses_count,
    };

    if (tweet.entities.hashtags) {
      metadata['tags'] = tweet.entities.hashtags.map(hashtag => hashtag.text);
    }
    if (!metadata['tags'].includes(foundKeyword)) {
      metadata['tags'].push(foundKeyword);
    }

    let hasExactCoordinates: boolean = (tweet.coordinates && tweet.coordinates.length == 2);

    if (tweet.place) {
      let place: any = tweet.place;
      if (place.place_type === 'city') {
        metadata['shownCity'] = place.name;
      }
      metadata['shownCountryName'] = place.country;
      metadata['shownCountryCode'] = place.country_code;

      let bb: any = place.bounding_box;
      // Use boundingbox coordinates if we don't have exact coordinates and if they exist
      if (!hasExactCoordinates && bb && bb.coordinates && bb.coordinates.length == 1 && bb.coordinates[0].length == 4 && bb.type === 'Polygon') {
        let c: number[] = bb.coordinates[0];
        metadata['gpsLongitude'] = (c[0][0] + c[2][0]) / 2;
        metadata['gpsLatitude'] = (c[0][1] + c[1][1]) / 2;
      }
    }
    if (hasExactCoordinates) {
      metadata['gpsLongitude'] = tweet.coordinates[0];
      metadata['gpsLatitude'] = tweet.coordinates[1];
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