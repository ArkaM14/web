import * as nconf from 'nconf';
import { Configuration } from "./server/services/settings/config-model";
import { Config } from "./server/services/settings/config";
import express from "express";
import * as multer from "multer";
import * as pug from "pug";
var Poet = require("poet");
// import { GitFetcher } from "./server/services/git-fetcher/git-fetcher";
// import { GitListener } from "./server/services/git-listener/git-listener";
import path from "path";

var favicon = require('serve-favicon');
var session = require('express-session');
var bodyParser = require('body-parser');

var http = require('http');

export class web {
    private app: express.Application = express();
    private configService = new Config();

    constructor() {
        try {
            this.configService.load((config: Configuration) => {

                try {
                    this.app.use(bodyParser.json());
                    this.app.use(bodyParser.urlencoded({ extended: false }));
                    console.log(path.join(__dirname,"posts"))
                    var poet = Poet(this.app, {
                        postsPerPage: 12,
                        posts: path.join(__dirname,"posts") ,
                        metaFormat: 'yaml',
                        showDrafts: config.showDrafts,
                        showFuture: config.showFuture,
                        routes: {
                            '/blog/:post': 'post',
                            '/blog/:page': 'page',
                            '/tags/:tag': 'tag',
                            '/categories/:category': 'category'
                        }
                    });

                    poet.watch(() => {
                        console.log("Change detected");
                        //let posts = poet.helper.getPosts(0, 5);

                    }).init((err: any, cb: any) => {
                        console.error(err);
                    }).then(
                        (data: any, cb: any) => {
                            console.log("Initialized");
                            let posts = poet.helper.getPosts(0, 6);
                            console.log(JSON.stringify(posts, null, 1))
                        });


                    this.app.set('view engine', 'pug');
                    this.app.set('views', __dirname + '/views');
                    this.app.get('/blog', (req, res) => {
                        res.render('index');
                    });
                    this.app.get('/pages', (req, res) => {
                        res.render('index');
                    });

                    this.app.get('/categories', (req, res) => {
                        res.render('index');
                    });

                    this.app.get('/rss', (req, res) => {
                        // Only get the latest posts
                        var posts = poet.helpers.getPosts(0, 20);
                        res.setHeader('Content-Type', 'application/rss+xml');
                        res.render('rss', {
                            posts: posts,
                            tag: '',
                            tagUrl: ''
                        });
                    });

                    poet.addRoute('/rss/tag/:bytag', (req: any, res: any) => {
                        res.setHeader('Content-Type', 'application/rss+xml');
                        var tagPosts = poet.helpers.postsWithTag(req.params.bytag);
                        if (tagPosts.length) {
                            res.render('rss', {
                                posts: tagPosts,
                                tag: req.params.bytag,
                                tagUrl: '/tag/' + req.params.bytag
                            });
                        }
                    });

                    this.app.get('/tags', (req, res) => {
                        res.render('index');
                    });
                    this.app.use('/.well-known', express.static(__dirname + '/www/.well-known')); //static route for Letsncrypt validation
                    this.app.use('/posts/images', express.static(__dirname + '/posts/images')); //static route for Blog images
                    this.app.use(express.static(__dirname + '/www')); // All static stuff from /app/wwww

                    this.app.get('/sitemap.xml', (req, res) => {
                        // Only get the latest posts
                        var postCount = poet.helpers.getPostCount();
                        var posts = poet.helpers.getPosts(0, postCount);
                        res.setHeader('Content-Type', 'application/xml');
                        res.render('sitemap', { posts: posts });
                    });

                    // let gitFetcher = new GitFetcher(config.hookconfig); // github web-hook middleware
                    // this.app.use(config.hookconfig.route, new GitListener(config.hookconfig, gitFetcher.handleHookEvent).serverHandler);

                    // catch 404 and forward to error handler



                    var pkg = require('./package.json');
                    var httpServer = http.createServer(this.app);
                    httpServer.listen(3003, (): void => {
                        console.log(pkg.name, 'listening on port ', httpServer.address().port);
                    });
                }
                catch (err) {
                    console.log("inner catch:");
                    console.error(err);
                }
            });
        }
        catch (err) {
            console.log("Outer catch:");
            console.error(err);
        }
    }
}

var piofthings = new web();
