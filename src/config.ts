export class Config {
  /**
   * HTTP Port where the app runs.
   */
  static httpPort: string = process.env.ESI_HTTP_PORT || '9095';

  static twitterConsumerKey: string = process.env.ESI_TWITTER_CONSUMER_KEY || '';

  static twitterConsumerSecret: string = process.env.ESI_TWITTER_CONSUMER_SECRET || '';

  static twitterAccessTokenKey: string = process.env.ESI_TWITTER_ACCESS_TOKEN_KEY || '';

  static twitterAccessTokenSecret: string = process.env.ESI_TWITTER_ACCESS_TOKEN_SECRET || '';

  /**
   * Temporary directory used for downloading images.
   */
  static tempDir: string = process.env.ESI_TEMP_DIR || './temp';

  /**
   * Topic config file.
   */
  static topicConfigFile: string = process.env.ESI_TOPIC_CONFIG_FILE || './topic-config.json';
 
  /**
   * Refresh interval in seconds at which the Twitter stream is reloaded, defaults to 10 minutes
   * 
   * From Twitter side, the stream will be open indefintely, we do however want to reset the stream
   * regularly to handle potential connection loss.
   */
  static topicRefreshInterval:number = parseInt(process.env.ESI_TOPIC_REFRESH_INTERVAL) || 600;

  /**
   * Elvis server url.
   */
  static elvisUrl: string = process.env.ESI_ELVIS_URL || 'http://localhost:8080';

  /**
   * Elvis username. 
   * 
   * Permission configuration:
   * - This user should be licensed as an API user.
   * - Ensure that the user can import files into the specified paths
   */
  static elvisUsername: string = process.env.ESI_ELVIS_USER || 'admin';

  /**
   * Elvis password.
   */
  static elvisPassword: string = process.env.ESI_ELVIS_PASSWORD || 'changemenow';
  
  /**
   * Destination in Elvis where Twitter files are stored.
   */
  static twitterFilesDestination: string = process.env.TWITTER_FILES_DESTINATION || '/Demo Zone/Social/Twitter';

}