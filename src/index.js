const process = require('process');
const { spawn } = require('child_process');
const fs = require('fs');
const CronJob = require('cron').CronJob;

class DBBackuper
{
    start() {

        if (this.isV())
        {
            console.dir('Started!');
        }

        if (this.getEnv().DO_MONTHLY)
        {
            this.startJob('1 1 1 1 * *', 'monthly');
        }

        if (this.getEnv().DO_DAILY)
        {
            this.startJob('1 1 1 * * *', 'daily', 3600 * 24 * 30);
        }

        // this is only for debugging
        if (this.getEnv().DO_MINUTELY)
        {
            this.startJob('1 * * * * *', 'minutely', 3600);
        }
        // if (this.getEnv().DO_SECONDLY)
        // {
        //     this.startJob('* * * * * *', 'secondly', 600);
        // }
    }

    startJob(time, label, rotationPeriod = -1) {
        return new CronJob(time, () => {

            const path = `${this.getEnv().STORAGE_PATH}${label}`;
            this.maybeMakeFolder(path).then(() => {
                if (rotationPeriod > 0)
                {
                    return this.runCmd('find', [path, '-not', '-newermt', `-${rotationPeriod} seconds`, '-type', 'f', '-delete']);
                }
            }).then(() => {
                const d = new Date(Date.now());
                const args = ['--uri', this.getEnv().MONGO_URL, `--archive=${path}/${this.makeName(d)}.gz`, '--gzip'];

                if (!this.isV())
                {
                    args.unshift('--quiet');
                }

                this.runCmd('mongodump', args).then(() => {
                    // console.dir('done');
                }).catch((e) => {
                    if (this.isV())
                    {
                        console.dir('Dump failed:');
                        console.dir(e);
                    }
                });
            });
        }, null, true, 'Europe/Moscow');
    }

    isV() {
        return !!this.getEnv().VERBOSE;
    }

    getEnv() {
        return process.env;
    }

    runCmd(cmd, args) {

        if (this.isV())
        {
            console.dir('CALL:');
            console.log(`${cmd} ${args.join(' ')}`);
        }

        return new Promise((resolve, reject) => {
            const handler = spawn(cmd, args);
            handler.on('close', (code) => {

                if (this.isV())
                {
                    console.dir(`Done, code: ${code}`);
                }

                if (code > 0)
                {
                    reject(code);
                }
                else
                {
                    resolve(code);
                }
            });

            if (this.isV())
            {
                handler.stderr.on('data', (data) => {
                    console.log(`[stderr]: ${data}`);
                });
                handler.stdout.on('data', (data) => {
                    console.log(`[stdout]: ${data}`);
                });
            }
        });
    }

    makeName(d)
    {
        return `${this.pad(d.getUTCHours())}-${this.pad(d.getUTCMinutes())}---${this.pad(d.getUTCDate())}-${this.pad(d.getUTCMonth())}-${this.pad(d.getUTCFullYear())}`;
    }

    pad(value)
    {
        return value.toString().padStart(2, '0');
    }

    maybeMakeFolder(folder)
    {
        return this.isExists(folder).then((exists) => {
            if (!exists)
            {
                if (this.isV())
                {
                    console.dir(`Creating folder: ${folder}`);
                }

                return new Promise((resolve, reject) => {
                    fs.mkdir(folder, 0o755, (err) => {
                        if (err)
                        {
                            reject(err);
                        }
                        else
                        {
                            resolve(true);
                        }
                    });
                });
            }
            else
            {
                if (this.isV())
                {
                    console.dir(`Folder exists: ${folder}`);
                }
            }
        });
    }

    isExists(folder)
    {
        return new Promise((resolve) => {
            fs.stat(folder, (err) => {
                // todo: poor check
                resolve(!err);
            });
        });
    }
}

(new DBBackuper()).start();


