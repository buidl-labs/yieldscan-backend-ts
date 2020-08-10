export {};

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface Request {
      // Anything you ever join with the express' request object
    }
  }

  namespace Models {
    // Example: export type SomeModel = Model<ModelInterface & Document>;
  }
}
