import { Headers } from 'node-fetch';
import fetch from 'node-fetch';

export class GooeeApi
{
  repositoryName: string;
  subdomain: string;

  /**
   * Constructor
   */
  constructor(repositoryName: string, subdomain: string) {
    this.repositoryName = repositoryName;
    this.subdomain = subdomain;
  }

  /**
   * Run a gooee action
   */
  async run(action: string): Promise<void> {
    const url = `https://${this.subdomain}-gooee.${this.repositoryName}.uat.stickeedev.com/action`;
    const headers = new Headers();

    headers.set('Authorization', 'Basic ' + Buffer.from('stickee:guest').toString('base64'));

    const data = new URLSearchParams({ action });

    console.log(`POST ${url} : ${data.toString()}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: data,
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    console.log(await response.text());
  }
}
