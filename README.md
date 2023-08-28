# Monitor Web page of [Socks5BalancerAsio](https://github.com/Socks5Balancer/Socks5BalancerAsio)
---

this project is part of Socks5BalancerAsio.

for easy to develop, the Socks5BalancerAsio's html sub-dir been split to this project.

the LICENSE of this project is following Socks5BalancerAsio.

### how to use this
---

download the Binary Release from [Socks5BalancerAsio](https://github.com/Socks5Balancer/Socks5BalancerAsio).


### how to dev
---

#### A: 

clone project, use ```yarn``` to init project.

run ```yarn run build:watch``` dir to start continue build .

then you can open the [stateBootstrap.html](stateBootstrap.html) page in a web server to view result.

#### B:

clone the parents project [Socks5BalancerAsio](https://github.com/Socks5Balancer/Socks5BalancerAsio) and init submodule,   
build and run parents Socks5BalancerAsio (see it's readme for how to do) , 
`cd ./html/` into this project, run ```yarn``` to init this project.

run ```yarn run build:watch``` in `html` dir to start continue build .

then you can access the `http://127.0.0.1:5002/` to view result.


---


because Clion have some performance issue when open different type file in same project, 
you can open clion in parents project to write c++ code AND open WebStorm in the `html` sub-dir to write Web code.

