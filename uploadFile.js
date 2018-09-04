;(function(undefined) {
	"use strict"
	var _global;
	
	// 对象合并
    function extend(o,n,override) {
        for(var key in n){
            if(n.hasOwnProperty(key) && (!o.hasOwnProperty(key) || override)){
                o[key]=n[key];
            }
        }
        return o;
    }

    //生成唯一标识
	function guid() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	}

	//计算文件大小
	function countSize(size){
		return (Math.round(size * 100 / (1024 * 1024)) / 100);
	}

	// 通过class查找dom
    if(!('getElementsByClass' in HTMLElement)){
        HTMLElement.prototype.getElementsByClass = function(n){
            var el = [],
                _el = this.getElementsByTagName('*');
            for (var i=0; i<_el.length; i++ ) {
                if (!!_el[i].className && (typeof _el[i].className == 'string') && _el[i].className.indexOf(n) > -1 ) {
                    el[el.length] = _el[i];
                }
            }
            return el;
        };
        ((typeof HTMLDocument !== 'undefined') ? HTMLDocument : Document).prototype.getElementsByClass = HTMLElement.prototype.getElementsByClass;
    }


	function UpLoadFile(opt){
		this._init(opt);
	}

	UpLoadFile.prototype = {
		construct: this,
		_init: function(opt){
			//默认参数
			/**
				id input[type=file] 的id
				name input[type=file] 的name
				type 上传的类型 可以是image,video大类，也可以是png jpeg gif等具体类型  若为*则表示不限制
				limit 上传数量 -1不限制
				size 上传单个大小  单位M  -1不限制
				url	上传地址
				autoupload 是否自动上传（true 添加一个文件就上传一个，false 则不自动上传由开发者自由触发上传）
				previewIndex 预览的层级
				successFun 上传成功触发
				errorFun 上传失败触发
				changeFun 选择文件之后触发
				errFileType 选择文件的类型错误触发
			**/
			let defaultOpt = {
				id: 'uploadFile',
				name: 'uploadFile',
				type:['image', 'video'],
				limit: 9,
				size: 50,
				url: '',
				autoupload: true,
				previewIndex:1000,
				sucFun: function(res){},
				errFun: function(res){},
				changeFun: function(res){},
				errFileFun: function(res){},
				progressFun: function(res){},
				cancelFun: function(res){},
				completeFun: function(res){}
			};
			this.defaultOpt = extend(defaultOpt, opt, true);//合并参数
			this.files = [];//存储要上传的值
			this.dom = {};
			this.xhr = [];
			var _this = this;
			if (!!this.defaultOpt.id) {
				this.dom = document.getElementById(this.defaultOpt.id);
				this.dom.onchange = function() {
					let fileLength = _this.dom.files.length;
					if(fileLength == 0) return;
					console.log('选择成功');
					for(var i = 0; i < fileLength; i++){
						let filterRes = _this._filterFile(_this.dom.files[i]);
						if(filterRes.error == 0){
							let key = _this._setUploadVal(_this.dom.files[i]);
							let res = {key:key};
							!!_this.defaultOpt.changeFun && _this.defaultOpt.changeFun(res);
							if(_this.defaultOpt.autoupload){
								_this.upload();
							}
						}else{
							console.log('文件类型错误');
							!!_this.defaultOpt.errFileFun && _this.defaultOpt.errFileFun(filterRes);
						}
					}
					
				}
			}
			
		},
		//过滤文件
		_filterFile: function(file){
			console.log(this.defaultOpt.type);
			let flag = false;

			//判断文件个数
			//注意因为this.files存储的键值不是数字索引所以this.files.length的长度是错误的，所以需要Object.keys(this.files).length来计算
			if(this.defaultOpt.limit != -1 && Object.keys(this.files).length >= this.defaultOpt.limit)
				return {error:10001, msg: 'File limit ' + this.defaultOpt.limit, data:file};
			//判断文件类型
			if(this.defaultOpt.type != '*') {
				for(var key in this.defaultOpt.type){
					let rep = new RegExp(this.defaultOpt.type[key]);
					if(rep.test(file.type)) {
						flag = true;
						break;
					}
				}
				if(!flag) return {error:10002, msg: 'File type error', data:file};
			}
			//判断文件大小
			if(this.defaultOpt.size != -1 && countSize(file.size) > this.defaultOpt.size){
				return {error:10003, msg: 'File size more than ' + this.defaultOpt.size + 'M' , data:file};
			}
			return {error:0, msg: 'ok'};
		},
		//存储上传的文件
		_setUploadVal: function(val){
			let key = guid();
			this.files[key] = val;
			return key;
		},
		//获取将要上传的文件
		getAllFiles: function(){
			console.log(this.files);
			return this.files;
		},
		//上传文件
		upload: function(callback){
			if(Object.keys(this.files).length == 0) return false;
			var fd = new FormData();
			var _this = this;
			for(var key in this.files){
				fd.append(this.defaultOpt.name + "[]", this.files[key]);
				this.xhr[key] = new XMLHttpRequest();
				this.xhr[key].key = key;
				//监听文件上传进度
	           	this.xhr[key].upload.addEventListener("progress", function(res){
	           		var percentComplete;
					if (res.lengthComputable) {
		                percentComplete = Math.round(res.loaded * 100 / res.total);
		            } else {
		                percentComplete = -1;
		            }
	            	!!_this.defaultOpt.progressFun && _this.defaultOpt.progressFun(percentComplete, res);
	            }, false);
	            //监听上传成功
	            this.xhr[key].addEventListener("load", function(res){
	            	!!_this.defaultOpt.sucFun && _this.defaultOpt.sucFun(this.responseText, res);
	            }, false);
	            //监听上传失败
	            this.xhr[key].addEventListener("error", function(res){
	            	!!_this.defaultOpt.errFun && _this.defaultOpt.errFun(res);
	            }, false);
	            //监听上传取消
	            this.xhr[key].addEventListener("abort", function(res){
	            	!!_this.defaultOpt.cancelFun && _this.defaultOpt.cancelFun(res);
	            }, false);
	            //监听上传完成（无论成功、失败、取消）
	            this.xhr[key].addEventListener("loadend", function(res){
	            	if(!!_this.xhr[this.key]){
	            		_this.xhr[this.key] = null;
	            		delete _this.xhr[this.key];
	            	}
	            	!!_this.defaultOpt.completeFun && _this.defaultOpt.completeFun(res);
	            }, false);
	            this.xhr[key].open("POST", this.defaultOpt.url, true);
	            this.xhr[key].send(fd);
	            this.deleteFile(key);
			}
			
            !!callback && callback();
            return true;
		},
		//取消上传
		abort: function(callback){
			if(!!this.xhr && Object.keys(this.files).length > 0){
				for(var key in this.xhr){
					this.xhr[key].abort();
					_this.xhr[this.key] = null;
					delete this.xhr[key];
				}
			}
			!!callback && callback();
			return;
		},
		//删除文件
		deleteFile: function(key){
			!!this.files[key] && delete this.files[key];
		},
		//预览文件(只支持视频和图片)
		previewFile: function(key){
			console.log(this.files[key]);
			if(!this.files[key]) return {error:10004, msg: 'File not exists'};
			let tmpFile = this.files[key];
			let type = tmpFile.type.split('/')[0];
			var content = '';
			if(type == 'image'){
				let imgobj = new Image();
				content = '<img src="'+window.URL.createObjectURL(tmpFile)+'"/>';
			}else if(type == 'video'){
				content = '<video src="' + window.URL.createObjectURL(tmpFile) + '"  controls="controls" >您的浏览器暂不支持视频播放！</video>';
			}else{
				return {error:10004, msg: 'No support for this type'};
			}
			let previewDiv = document.getElementById('newjk_previewImg');
			if(previewDiv){
				previewDiv.style.display = 'block';
				previewDiv.innerHTML = content;
			}else{
				let newdiv = document.createElement('div');
				content = '<div id="newjk_previewImg" class="newjk-backpop" style="z-index:' + this.previewIndex + '"><div class="newjk-container" >' + content + '</div></div>';
				newdiv.innerHTML = content;
				document.body.appendChild(newdiv);
				newdiv.addEventListener('click', function(){
					this.style.display = 'none';
				});
			}
		}
	};

	_global = (function(){ return this || (0, eval)('this'); }());
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = UpLoadFile;
	} else if (typeof define === 'function' && define.amd) {
		define(function(){ return UpLoadFile; });
	} else {
		!('UpLoadFile' in _global) && (_global.UpLoadFile = UpLoadFile);
	}
}());