export class State {

  public heightFilter: number;
  public yearFilter: Array<number>;
  private subscribers: any;

  constructor() {
    this.heightFilter = null;
    this.yearFilter = null;
    this.subscribers = {};
  }

  private notify(type, value) {
    this.subscribers[type].forEach((callback) => {
      callback(value);
    });
  }

  setState (type: string, value) {
    switch (type) {
      case 'heightChanged':
        this.heightFilter = value;
        break;
      case 'yearChanged':
        this.yearFilter = value;
        break;
    }
    this.notify(type, value);
  }

  addSubscriber(type: string, callback) {
    if (!this.subscribers.hasOwnProperty(type)) {
      this.subscribers[type] = [];
    }
    this.subscribers[type].push(callback);
  }
}