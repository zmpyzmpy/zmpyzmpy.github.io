---
layout: post
title:  "Host Flask application with uWSGI and Nginx on RHEL"
date: 2018-08-03 10:31:00 +0800 
tags:
- Machine Learning
- Linux
- Python
---

Recently I worked on a project for unilever and they would like a web application to host the whole machine learning services. We used Flask to build the application and now I have to deploy the application on their server. Here are the steps I took.

## 1.  Install Python and setup Flask and uwsgi

Since Python 3 cannot directly be installed by the package manager `yum` on **RHEL**, we need to do it manually.

### Step 1—install the dependency packages

```bash
sudo yum install gcc-c++ zlib-devel libffi-devel openssl-devel
```

### Step 2—download and install Python

1. Download (there may be newer releases on [Python.org](http://www.python.org/download/)):

    ```bash
    wget https://www.python.org/ftp/python/3.7.0/Python-3.7.0.tgz
    ```

2. Unzip

    ```bash
    tar xf Python-3.7.0.tgz
    ```


3. Prepare compilation

    ```bash
    cd Python-3.7.0/
    ./configure
    ```


4. Build

    ```bash
    make
    ```

5. Install

    ```bash
    sudo make install
    ```
    OR if you don't want to overwrite the `python` executable (safer, at least on some distros `yum` needs `python` to be `2.x`, such as for `RHEL6`) - you can install `python3.*` as a concurrent instance to the system default with an altinstall:

    ```bash
    sudo make altinstall
    ```
After installing Python3, we can use `pip` to install the packages we need. However, when I tried to use `pip`, I encountered the following problem:
```bash
pip is configured with locations that require TLS/SSL, however the ssl module in Python is not available.
Collecting <package>
  Could not fetch URL https://pypi.python.org/simple/<package>/: There was a problem confirming the ssl certificate: Can't connect to HTTPS URL because the SSL module is not available. - skipping
  Could not find a version that satisfies the requirement <package> (from versions: )
No matching distribution found for <package>
```
It turned out that I forgot to install the `openssl-devel` package at the beginning. So I installed it and ran 
```bash
sudo checkinstall
```
in the Python source code directory. Till now, Python3 was successfully installed in the system.

### Step 3—install the necessary Python packages through `pip`

In the project, we used `LightGBM` and some other open source to process the data and build models for it. Apart from the packages, it is important that we have saperate environments for development and production.

1. Setup virtual environment

   ```bash
   pip3 install --user virtualenv
   cd PATH-TO-PROJECT
   virtualenv production-env
   source production-env/bin/activate
   ```

   We call this environment `production-env`, after these steps, we have already entered this new virtual environment. It automatically duplicate the Python in the system with empty list of packages, try `pip3 freeze` will give us an empty list.

2. Install packages in the environment

   ```bash
   pip install lightgbm
   pip install pandas
   pip install Flask
   pip install xlrd
   pip install xlsxwriter
   pip install uwsgi
   ```

   As I already mentioned, we are to use LightGBM as our ML model, in automatically install `numpy` , `scipy` as well as `scikit_learn` which are its dependencies. We also need `pandas` to load and process the dataset. Since our data may be stored in Excel, we also need `xlrd` and `xlsxwriter` to read and write Excel files. Finally, as we will use `uWSGI` as our Deployment server and `Flask` to build the application, we also need these two packges to be installed.

   ### Step 4—Setup Flask and uWSGI

   Building Flask application is not in the scope of this post, I will show a toy example here. 

   #### Create a Sample App

   ```bash
   nano ~/myproject/myproject.py
   ```

   The application code will live in this file. It will import Flask and instantiate a Flask object. You can use this to define the functions that should be run when a specific route is requested:

   ```python
   from flask import Flask
   app = Flask(__name__)

   @app.route("/")
   def hello():
       return "<h1 style='color:blue'>Hello There!</h1>"

   if __name__ == "__main__":
       app.run(host='0.0.0.0')
   ```

   This basically defines what content to present when the root domain is accessed. Save and close the file when you're finished.

   #### Create the WSGI Entry Point

   Next, let's create a file that will serve as the entry point for our application. This will tell our uWSGI server how to interact with it.

   Let's call the file `wsgi.py`:

   ```bash
   nano ~/myproject/wsgi.py
   ```

   In this file, let's import the Flask instance from our application and then run it:

   ```python
   from myproject import app

   if __name__ == "__main__":
       app.run()
   ```

   Save and close the file when you are finished.

   ### Step 5—Configure uWSGI

   Your application is now written with an entry point established. We can now move on to configuring uWSGI.

   #### Creating a uWSGI Configuration File

   Ultimately we want something robust for long-term usage. We can create a uWSGI configuration file with the relevant options to achieve this.

   Let's place that file in our project directory and call it `myproject.ini`:

   ```bash
   nano ~/myproject/myproject.ini
   ```

   Inside, we will start off with the `[uwsgi]` header so that uWSGI knows to apply the settings.

   ```bash
   [uwsgi]
   module = wsgi:app
   chmod-socket = 666
   master = true
   enable-threads = true
   processes = 16
   callable = true
   single-interpreter = true
   socket = /home/user/tmp/myproject.sock
   vacuum = true
   wsgi-file = wsgi.py
   ```

   ### Step 6—Create a systemd Unit File

   Next, let's create the systemd service unit file. Creating a systemd unit file will allow Ubuntu's init system to automatically start uWSGI and serve the Flask application whenever the server boots.

   Create a unit file ending in `.service` within the `/etc/systemd/system` directory to begin:

   ```bash
   sudo nano /etc/systemd/system/myproject.service
   ```
   Inside, we'll start with the [Unit] section, which is used to specify metadata and dependencies. Let's put a description of our service here and tell the init system to only start this after the networking target has been reached. The `[Service]` section will specify the user and group that we want the process to run under. Let's give our regular user account ownership of the process since it owns all of the relevant files. Let's also give group ownership to the `nginx` group so that Nginx can communicate easily with the uWSGI processes. Remember to replace the username here with your username. Finally, let's add an `[Install]` section. This will tell systemd what to link this service to if we enable it to start at boot. We want this service to start when the regular multi-user system is up and running.

   ```bash
   [Unit]
   Description=uWSGI instance to serve myproject
   After=network.target

   [Service]
   User=nginx
   Group=user
   ExecStart= /bin/sh -c 'cd /home/user/myproject; source /home/user/myproject/production-env/bin/activate; uwsgi --ini myproject.ini'
   [Install]
   WantedBy=multi-user.target
   ```

   With that, our systemd service file is complete. Save and close it now.

   We can now start the uWSGI service we created and enable it so that it starts at boot:

   ```bash
   sudo systemctl start myproject
   sudo systemctl enable myproject
   ```
   Let's check the status:

   ```bash
   sudo systemctl status myproject
   ```

   If you see any errors, be sure to resolve them before continuing with the tutorial.


## 2.  Install Nginx

### Step 1—Add Nginx Repository

To add the CentOS 7 EPEL repository, open terminal and use the following command:

```bash
sudo yum install epel-release
```

### Step 2—Install Nginx

Now that the Nginx repository is installed on your server, install Nginx using the following `yum` command:

```bash
sudo yum install nginx
```

After you answer yes to the prompt, Nginx will finish installing on your server.

### Step 3—Start Nginx

Nginx does not start on its own. To get Nginx running, type:

```bash
sudo systemctl start nginx
```

Before continuing, you will probably want to enable Nginx to start when your system boots. To do so, enter the following command:

```bash
sudo systemctl enable nginx
```
### Step 3—Configure Nginx to Proxy Requests

Our uWSGI application server should now be up and running, waiting for requests on the socket file in the project directory. We need to configure Nginx to pass web requests to that socket using the `uwsgi` protocol.

Begin by opening up Nginx's default configuration file:

```bash
sudo nano /etc/nginx/nginx.conf
```

Open up a server block just above the other `server {}` block that is already in the file:

```bash
http {
    . . .

    include /etc/nginx/conf.d/*.conf;

    server {
    }

    server {
        listen 80 default_server;

        . . .
```

We will put all of the configuration for our Flask application inside of this new block. We will start by specifying that this block should listen on the default port 80 and that it should respond to our server's domain name or IP address:

```bash
user nginx;
http {
    . . .

	fastcgi_read_timeout 999999;
    server {
        listen 80;
        server_name server_domain_or_IP;

        location / {
            include uwsgi_params;
            uwsgi_pass unix:/home/user/myproject/myproject.sock;
        }
    }
}
```

That's basically all we need to serve our application. Note that we would like to use Flask to serve our model training processes, it is very likely that a request would take a long time to be processed (i.e. to train a model). So don't forget to add `fastcgi_read_timeout 999999;` to the `http` block of the `nginx` configuration file. Save and close the file when you're finished.

The `nginx` user must have access to our application directory in order to access the socket file there. By default, CentOS locks down each user's home directory very restrictively, so we will add the `nginx` user to our user's group so that we can then open up the minimum permissions necessary to grant access.

You can add the `nginx` user to your user group with the following command. Substitute your own username for the `user` in the command:

```bash
sudo usermod -a -G user nginx
```

Now, we can give our user group execute permissions on our home directory. This will allow the Nginx process to enter and access content within:

```bash
chmod 710 /home/user
```

With the permissions set up, we can test our Nginx configuration file for syntax errors:

```Bash
sudo nginx -t
```

If this returns without indicating any issues, we can start and enable the Nginx process so that it starts automatically at boot:

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

You should now be able to go to your server's domain name or IP address in your web browser and see your application.



## 3. Troubleshoot

### Permission denied problem

I encountered the permission denied problem during setup this environment:

```bash
(13: Permission denied) while connecting to upstream:[nginx]
```

Running the following commands fixed my issue:

```bash
sudo cat /var/log/audit/audit.log | grep nginx | grep denied | audit2allow -M mynginx
sudo semodule -i mynginx.pp
```

In case `audit2allow` is not availible in the system, run `yum install policycoreutils-python` to get `audit2allow` first. 

### No such file or directory problem

I initially followed the tutorial from [Flask documentation](http://flask.pocoo.org/docs/1.0/deploying/uwsgi/), however I ended up with this issue:

```bash
(2: No such file or directory) 
```

The solution I found was just to link the .sock in the user's directory rather than in a system folder. Inside the `myproject.ini` file:

```bash
socket = /home/user/tmp/myproject.sock
```



## Credits

> [https://www.digitalocean.com/community/tutorials/how-to-serve-flask-applications-with-uwsgi-and-nginx-on-centos-7](https://www.digitalocean.com/community/tutorials/how-to-serve-flask-applications-with-uwsgi-and-nginx-on-centos-7)

> [https://serverfault.com/questions/777749/how-to-disable-timeout-for-nginx](https://serverfault.com/questions/777749/how-to-disable-timeout-for-nginx)

> [https://stackoverflow.com/questions/41328451/ssl-module-in-python-is-not-available-when-installing-package-with-pip3](https://stackoverflow.com/questions/41328451/ssl-module-in-python-is-not-available-when-installing-package-with-pip3)





