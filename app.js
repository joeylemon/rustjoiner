var settings = {
	check_delay: 15
};

var lastSelection;
var descs = new Array();

var task;
var last = 0;

var customip_desc;
var entering = false;

setServers();

$("#start-button").click(function(e){
	start();
});

function setServers(){
	descs = new Array();
	for(var i = 0; i < servers.length; i++){
		var server = servers[i];
		queryServer(server);
	}
}

function queryServer(server, options){
	var split = server.split(":");
	var ip = split[0];
	var port = parseInt(split[1]);
	
	var sq = new SourceQuery(1000);
	sq.open(ip, port);
	
	sq.getInfo(function(err, response){
		if(response != null){
			result = getDesc(response);
			
			if(options && options.update){
				$("#content").html("Will join " + result.name + " <span id='selection-players'>(" + result.current_players + "/" + result.max_players + ")</span>");
				return;
			}
			
			if(!options || !options.custom){
				result['ip'] = server.replace(/\./g, '').replace(/:/g , '');
				result['regip'] = server;
				result['html'] = '' +
					'<tr id="' + result.ip + '">' +
						'<td class="row">' + result.name + '</td>' +
						'<td class="row" style="text-align: center;">' + result.current_players + '/' + result.max_players + '</td>' +
					'</tr>';
				
				descs.push(result);
				setListings();
			}else if(options && options.custom){
				result['regip'] = server;
				customip_desc = result;
				
				$("#content").css({
					"fontSize": "15px",
					"position": "fixed",
					"bottom": "0px",
					"width": "100%",
					"opacity": "0.5"
				});
				$("#content").html("Will join " + result.name + " <span id='selection-players'>(" + result.current_players + "/" + result.max_players + ")</span>");
				
				$("#custom-ip-box").hide();
				$("#started").show();
				$("#loader").show();
				$("#last-check").show();
				
				checkRustStatus();
				task = setInterval(function(){
					last++;
					
					if(last % settings.check_delay == 0){
						last = 0;
						
						checkRustStatus();
					}
					
					$("#last-check").html("Last checked " + last + " seconds ago.");
				}, 1000);
			}
		}else if(entering){
			$("#start-button").shake();
		}
		
		sq.close();
	});
}

function getDesc(info){
	var split = info.keywords.split(",");
	
	var max, current, queue;
	if(split[0] != 'oxide'){
		max = split[0].replace("mp", "");
		current = split[1].replace("cp", "");
		queue = split[2].replace("qp", "");
	}else{
		max = split[2].replace("mp", "");
		current = split[3].replace("cp", "");
		queue = split[4].replace("qp", "");
	}
	
	return {name: info.name, current_players: current, max_players: max, queue: queue};
}

function setListings(){
	$("#servers").html("");
	
	descs.sort(function(a, b){
		return b.current_players - a.current_players;
	});
	
	for(var i = 0; i < descs.length; i++){
		var desc = descs[i];
		$("#servers").append(desc.html);
		
		$("#" + desc.ip).click(function(e){
			var id = $(this).attr("id");
			select(id);
		});
	}
	
	$("#servers").append('' +
		'<tr id="custom-ip" colspan="2" style="background-color: rgba(0,0,0,0);color: #C1C1C1;">' +
			'<td class="row">Enter custom address</td>' +
		'</tr>');
		
	$("#custom-ip").click(function(e){
		enterCustomAddress();
	});
}

function enterCustomAddress(){
	entering = true;
	$("#table").css("filter", "blur(20px)");
	$("#table").css("borderRadius", "5px");
	$("#custom-ip-box").show();
}

function customAddressEntered(){
	var customip = document.getElementById("custom-ip-field").value;
	
	var dots = customip.split(".");
	var colons = customip.split(":");
	
	if(dots.length == 4 && colons.length == 2 && colons[1].length == 5 && customip.length > 15 && customip.length < 24){
		return true;
	}else{
		$("#start-button").shake();
		return false;
	}
}

function select(server){
	if(entering){
		return;
	}
	
	if(lastSelection){
		$("#" + lastSelection).css("backgroundColor", "");
	}	
	$("#" + server).css("backgroundColor", "rgba(255, 255, 255, 0.35)");
	
	lastSelection = server;
}

function start(){
	if(lastSelection){
		var desc = getDescOfID(lastSelection);
		$("#content").css({
			"fontSize": "15px",
			"position": "fixed",
			"bottom": "0px",
			"width": "100%",
			"opacity": "0.5"
		});
		$("#content").html("Will join " + desc.name + " <span id='selection-players'>(" + desc.current_players + "/" + desc.max_players + ")</span>");
		
		$("#started").show();
		$("#loader").show();
		$("#last-check").show();
		
		checkRustStatus();
		task = setInterval(function(){
			last++;
			
			if(last % settings.check_delay == 0){
				last = 0;
				
				checkRustStatus();
			}
			
			$("#last-check").html("Last checked " + last + " seconds ago.");
		}, 1000);
	}else if(customAddressEntered()){
		var customip = document.getElementById("custom-ip-field").value;
		queryServer(customip, {custom: true});
	}else{
		$("#start-button").shake();
	}
}

function getDescOfID(id){
	for(var i = 0; i < descs.length; i++){
		var d = descs[i];
		if(d.ip == id){
			return d;
		}
	}
}

function checkRustStatus(){
	request({
		url: 'http://api.steampowered.com/ISteamNews/GetNewsForApp/v0001/?appid=252490&count=1&maxlength=1&format=json',
		json: true
	}, function(error, response, body){
		if (!error && response.statusCode === 200){
			var post = body.appnews.newsitems.newsitem[0];
			post['date'] = parseInt(post.date + "000");
			
			var desc = (entering ? customip_desc : getDescOfID(lastSelection));
			
			if(post.title.includes("Devblog") && Date.now() - post.date < 86400000){
				clearInterval(task);
				$("#last-check").html("Rust is being opened...");
				
				opn('steam://connect/' + desc.regip);
				
				var opentask = setInterval(function(){
					exec('tasklist', function(err, stdout, stderr){
						var open = stdout.includes("Rust");
						if(open){
							$("#last-check").html("Pressing enter soon...");
							
							setTimeout(function(){
								robot.startJar();
								
								robot.press("enter").sleep(100).release("enter").go().then(function(){
									$("#last-check").html("Pressed enter...");
								
									setTimeout(function(){remote.getCurrentWindow().close();}, 1000);
								});
							}, 7000);
							
							clearInterval(opentask);
						}
					});
				}, 5000);
			}else{
				queryServer(desc.regip, {update: true});
			}
		}
	});
}

jQuery.fn.shake = function() {
    this.each(function(i) {
        $(this).css({
            "position" : "relative"
        });
        for (var x = 1; x <= 3; x++) {
            $(this).animate({
                left : -25
            }, 10).animate({
                left : 0
            }, 50).animate({
                left : 25
            }, 10).animate({
                left : 0
            }, 50);
        }
    });
    return this;
}