# Wingspan H2H Data

Simple graphs and aggregations for wingspan games.




## Getting Started

The `.nvmrc` instructs to use Node v20, and yeh makes use of `nvm` 

> nvm install  
> nvm use  
> npm install  
> npm run dev

Admin 
> npm run dev:admin  

To get to the admin site which allows entering of data and whatnot.

## Deploying 'Remotely'

Check out the [Deployment Instructions](docs/DEPLOY.md) for how to run this 'remotely', just basics with ssh/docker running on a local server or whatever. 

## Github Pages

Public page is deployed on Github pages to allow easy viewing of stats offline, but as its static there is no updating of said stats etc... purposefully.  Deployed via `gh-pages` package

> npm run deploy  
  
## TODO

* Probably should put some unit tests in here for some of the functions
* Some of the code is a bit verbose, could do with a tidy-up
* Percentage of totals analysis
