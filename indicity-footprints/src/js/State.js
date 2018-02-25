define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class State {
        constructor() {
            this.heightFilter = null;
            this.yearFilter = null;
            this.subscribers = {};
        }
        notify(type, value) {
            this.subscribers[type].forEach((callback) => {
                callback(value);
            });
        }
        setState(type, value) {
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
        addSubscriber(type, callback) {
            if (!this.subscribers.hasOwnProperty(type)) {
                this.subscribers[type] = [];
            }
            this.subscribers[type].push(callback);
        }
    }
    exports.State = State;
});
