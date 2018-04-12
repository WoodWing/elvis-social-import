import { Request, Response } from 'express';
import { TopicConfig } from './topic-config';
import { Router } from 'express';

export class TopicsApi {

  constructor(public router: Router) {
  }

  public async addRoutes(): Promise<void> {

    let topicConfig = TopicConfig.getInstance();

    /**
     * Get topics
     */
    this.router.get('/topics', (req: Request, res: Response) => {
      // keep the compiler happy
      req = req;
      res.status(200).send(topicConfig.topics);
    });

    /**
     * Save a topic
     */
    this.router.put('/topics', (req: Request, res: Response) => {
      if (!req.body) {
        return this.handleError('Invalid request, no JSON body specified.', req, res, 422);
      }
      // TODO: Validate type
      topicConfig.saveTopic(req.body);
      res.status(200).send();
    });

    /**
     * Delete a topic
     */
    this.router.delete('/topics/:name', (req: Request, res: Response) => {
      let name: string = req.params.name;
      if (!name) {
        return this.handleError('Invalid request, parameter "name" is required.', req, res, 422);
      }
      topicConfig.removeTopic(name);
      res.status(200).send();
    });
  }

  protected handleError(message: string, req, res, statusCode: number = 500): void {
    let errorMsg:string = 'API call failed: ' + req.method + ' "' + req.originalUrl + '"';
    if (req.params) {
      errorMsg += '; with params: ' + JSON.stringify(req.params);
    }
    if (req.body) {
      errorMsg += '; with body: ' + JSON.stringify(req.body);
    }
    errorMsg += '; Details: ' + message;
    res.status(statusCode).send(errorMsg);
  }
}
