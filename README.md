# Cinchy Angular-SDK

See [@cinchy-co/angular-sdk](https://www.npmjs.com/package/@cinchy-co/angular-sdk) on NPM.

Source: [`projects/angular-sdk`](projects/angular-sdk)

## Local Development

In order to test changes to the SDK in your local library, you can use [Yalc](https://github.com/wclr/yalc).

1. Install yalc as a global dependency: ```npm i -g yalc```
2. Update the version in `projects/angular-sdk/package.json` to something with a custom tag, e.g. `5.1.2-debug`
3. In the angular-sdk-wrapper root folder, run `yalc publish projects/angular-sdk/dist --push`
4. In your consuming application, run `yalc add @cinchy-co/angular-sdk`
5. In your consuming application, run `npm install`, then start your dev server in the usual way and check to see that the SDK changes you made are visible
6. When you make further changes, simply perform steps 3-5 to propagate them to your application

Note that the publishing scripts require write permissions on the repo in order to add a release candidate. The error message returned from a call with insufficient permissions will simply indicate that the library cannot be found.

## Additional Resources

- [Platform Documentation](https://platform.docs.cinchy.com/)
- [Support](http://support.cinchy.com/)

## License

This project is license under the terms of the [MIT License](https://github.com/cinchy-co/angular-sdk/blob/master/LICENSE)
