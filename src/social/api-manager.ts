import { Application, Router } from 'express';
import { TopicsApi } from './topics-api';

export class ApiManager {

  private router: Router;

  constructor(public app:Application) {
    this.router = Router();
    // Prefix all API's with /api
    this.app.use('/api', this.router);
    this.addRoutes(); 
  }

  /**
   * Add API routes
   */
  private addRoutes(): void {
    
    // API Request logging
    this.router.use((req, res, next) => {
      // Keep the compiler happy
      res = res;
      console.info('API call received: ' + req.method + ' "' + req.originalUrl);
      next();
    });
 
    new TopicsApi(this.router).addRoutes();
  }
}