window.addEventListener("load",fetchZips)

function fetchZips() {
	imgs = document.getElementsByTagName("lgcf");
	for (let i of imgs) {
		url = i.getAttribute("src");
		var xhttp = new XMLHttpRequest();
		xhttp.open("GET",url,true);
		xhttp.responseType = "arraybuffer";
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				var bytes = new Uint8Array(this.response);
				fillWithFile(i,bytes);
		   	}
		}
		xhttp.send()
	}
}

function fillWithFile(element,bytes) {

	var zip = new JSZip();

	zip.loadAsync(bytes).then(function(zip) {

		var promises = []

		var images = [];
		var baseimage;

		// data file
		zip.file("image.yml").async("string").then(function (yml) {
			data = jsyaml.load(yml)
			images = data['parts'];
			baseimage = data["base"]

			//load base image
			pr = zip.file(baseimage).async("base64");
			pr.then(function (data) {
				baseimage = data;
			});
			promises.push(pr);

			for (let cat of images) {
				name = cat["name"];
				cat["b64values"] = [];
				for (let img of cat['values']) {
					pr = zip.file(img).async("base64");
					pr.then(function (data) {
						cat["b64values"].push(data);
					});
					promises.push(pr);
				}
			}

			//basically we're combining all the promises into one and when that's done (because all are done) we're good
			Promise.all(promises).then(function() {
				buildImage(element,images,baseimage);
			});

		});

	});
}




function buildImage(element,images,baseimage) {





	var SET_HEIGHT = 900;



	var i = new Image();
	i.onload = function() {
		console.log("ON LOAD");
		var height = i.height;
		var width = i.width;
		var scale = SET_HEIGHT / height;

		var stylenode = document.createElement("style");
		stylenode.innerHTML = `
		.lgcf_image_container {
			position:relative;
			height:` + (height * scale) + `;
			width:` + (width * scale) + `;
		}
		.lgcf_image_container img {
			z-index:-10000;
			position:absolute;
			height:` + SET_HEIGHT + `px;
		}
		.buttons {
			z-index:20000;
		}
		.lgcf_hide {
			display:none;
		}
		span.lgcf_nav {
			position:absolute;
			z-index:20000;
			font-size:100px;
			cursor:pointer;
			display:none;
			text-shadow: -1px 0 white, 0 1px white, 1px 0 white, 0 -1px white;
			user-select:none;
		}
		div.lgcf_image_container:hover span.lgcf_nav {
			display:inline;
		}
		`

		element.appendChild(stylenode);


		var container = document.createElement("div")
		container.classList.add("lgcf_image_container")
		element.appendChild(container)

		var img_base = document.createElement("img")
		img_base.src = "data:image/png;base64," + baseimage

		container.appendChild(img_base)


		for (const category of images) {
			console.log(category)
			for (let option of category["b64values"]) {

				img = document.createElement("img")
				img.classList.add("lgcf_imgcat_" + category["name"])
				img.classList.add("lgcf_hide")
				img.src = "data:image/png;base64," + option
				container.appendChild(img)

			}



			// create functions to navigate
			function next() {
				var images = document.getElementsByClassName("lgcf_imgcat_" + category['name']);
				var toggle = false;
				for (let i of images) {
					if (toggle) {
						i.classList.remove("lgcf_hide");
						return
					}
					if (!i.classList.contains("lgcf_hide")) {
						toggle = true;
						i.classList.add("lgcf_hide");
					}
				}
				// if toggle true at the end, last one was shown, so do nothing (show base again)
				// if toggle false at the end, everything was hidden, so show first
				if (!toggle) {
					images[0].classList.remove("lgcf_hide");
				}
			}
			function prev() {
				var images = document.getElementsByClassName("lgcf_imgcat_" + category['name']);
				images = Array.from(images)
				images.reverse()
				var toggle = false;
				for (let i of images) {
					if (toggle) {
						i.classList.remove("lgcf_hide");
						return
					}
					if (!i.classList.contains("lgcf_hide")) {
						toggle = true;
						i.classList.add("lgcf_hide");
					}
				}
				// if toggle true at the end, last one was shown, so do nothing (show base again)
				// if toggle false at the end, everything was hidden, so show first
				if (!toggle) {
					images[0].classList.remove("lgcf_hide");
				}
			}


			nav_prev = document.createElement("span")
			nav_prev.classList.add("lgcf_nav")
			nav_prev.style = "top:" + category['position'][1]*scale + ";left:" + category['position'][0]*scale + ";"
			nav_prev.onclick = prev;
			nav_prev.innerHTML = "<"
			container.appendChild(nav_prev)

			nav_next = document.createElement("span")
			nav_next.classList.add("lgcf_nav")
			nav_next.style = "top:" + category['position'][1]*scale + ";left:" + (category['position'][0] + category['position'][2])*scale + ";"
			nav_next.onclick = next;
			nav_next.innerHTML = ">"
			container.appendChild(nav_next)

		}

	};

	i.src = "data:image/png;base64," + baseimage;


}
