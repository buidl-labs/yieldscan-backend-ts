# YieldScan Backend

  ## Development

Clone the repository:

```
git clone https://github.com/nblogist/yieldscan-backend-ts.git
```

cd into the main folder:

```
cd yieldscan-backend-ts
```

  The first time, you will need to run:



```
  npm install
  ```


  Define the following environment variables or simply save them in a `.env` file inside the main folder:


```
MONGODB_URI=your mongo url
WS_PROVIDER_URL='wss://mainnet1.edgewa.re'    # For Edgeware
CRAWLER_ERA_POINTS_HISTORY_ENABLE=true
CRAWLER_NOMINATOR_HISTORY_ENABLE=true
CRAWLER_VALIDATORS_ENABLED=true
CRAWLER_ACTIVE_NOMINATORS_ENABLED=true
CRAWLER_ACCOUNT_IDENTITY=true
CRAWLER_TOTAL_REWARD_HISTORY=true
CRAWLER_COUNCIL_ENABLED=true
LOG_LEVEL='debug'
```

Then just start the server with

```
npm start
```

  It uses nodemon for livereloading ✌️

**IMPORTANT NOTE:** When creating the database for the first time, it would might take around 30-45 minutes for all data endpoints to start functioning.

  ## Codebase Guide:

  ### Git commit

  + Run `npm run git:commit` for commiting your code and follow the process

  ### How to create route?

  + Create `route` file: `src/api/routes/<your-route-name>.ts`

  Example:


``` javascript
    import {
        Router,
        Request,
        Response
    } from 'express';
    const route = Router();

    export default (app: Router) => {
        // Register our endpoint for this route-apis
        app.use('/validator', route);

        route.get('/', (req: Request, res: Response) => {
            return res.json({
                validators: []
            }).status(200);
        });
    };
```

  + Register your created route in `src/api/routes/index.ts` by passing it the appInstance

  ### How to add/use services?

  + Create `service` file (if not exists): `src/services/<service-name>.ts`

  Example:


``` javascript
    import {
        Service,
        Inject
    } from 'typedi';
    import SomeOtherService from './some-other-service';
    import {
        EventDispatcher,
        EventDispatcherInterface
    } from '../decorators/eventDispatcher';

    @Service()
    export default class YourService {
        constructor(
            // inject mongoose models that you've registered in your containers
            @Inject('validatorModel') private validatorModel: Models.ValidatorModel,

            // if you wish to use some other service in this service
            private someOtherService: SomeOtherService,

            // if you wish to dispatch events from this service
            @EventDispatcher() private eventDispatcher: EventDispatcherInterface,
        ) {}
    };
```

  + Use your service by passing it through DI Container

  Example:


``` javascript
    import YourService from 'services/your-service';

    const yourServiceInstance = Container.get(YourService);
```

  ### How to create/use subcribers?

  + Create `subscriber` file (if not exists): `src/subscribers/<subscriber-name>.ts`

  Example:


``` javascript
    import {
        Container
    } from 'typedi';
    import {
        EventSubscriber,
        On
    } from 'event-dispatch';

    @EventSubscriber()
    export default class YourSubscriber {
        @On(events.eventGroup.someEvent)
        public eventHandlerForTheAboveEvent({
            params
        }) {
            // do stuff
        }
    };
```

  + Trigger an event from anywhere (preferably a service) in the app using the `eventDispatcher` instance

  Example:


``` javascript
    eventDispatcher.dispatch(events.eventGroup.someEvent, {
        ...eventParams
    });
```

  ### How to create new models?

  + Create `definition` file: `src/models/definitions/<definition-name>.ts`

  Example:


``` javascript
    export default {
        name: {
            type: String,
            required: true,
            index: true
        },
    };
```

  + Create interface for this model: `src/interfaces/<interface-name>.ts`

  Example:


``` javascript
    interface IValidator {
        // fields here
    };
```

  + Create `model` file: `src/models/<model-name>.ts`

  Example:


``` javascript
    import {
        IValidator
    } from '../interfaces/IValidator';
    import ValidatorDefinition from './definitions/validator.ts';
    import mongoose from 'mongoose';

    const Validator = new mongoose.Schema(ValidatorDefinition, {
        timestamps: true
    });

    export default mongoose.model < IValidator & mongoose.Document > ('Validator', Validator);
```

  + Register the mongoose model and the interface globally for TS under `src/types/express/index.d.ts`

  + Register the model into the DI Container by adding it to `models` array: `src/loaders/index.ts`

  + To use the model anywhere:



``` javascript
    const modelInstance = Container.get('modelName');
```
