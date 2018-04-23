
let rawList, tree;
let technologies_png_path = 'stellaris_asset/technologies_png/';

function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}

function toGraphic(sciList) {
    let nodes = [], edges = [];

    let nameIdMap = {};
    sciList.forEach(function (term, i) {
        nameIdMap[term['key']] = i;
    });

    sciList.forEach(function (term) {
        let key = term['key'];
        let prerequisites = term['prerequisites'];
        nodes.push({
            name: key,
            image: technologies_png_path + key + '.png'
        });
        if (isArray(prerequisites)) {
            prerequisites.forEach(function (name) {
                let edge = {source: nameIdMap[key], target: nameIdMap[name]};
                edges.push(edge);
            });
        }
    });
    return {nodes: nodes, edges: edges}
}

function render(graph, localisation, width, height, linkDistance, charge, img_w, img_h) {
    let svg = d3.select('svg').attr('width', width).attr('height', height);

    svg.append('defs').html('<linearGradient id="orange_red" x1="0%" y1="0%" x2="0%" y2="100%">' +
        '<stop offset="0%" style="stop-color:rgb(18,29,26);' +
        'stop-opacity:1"/>' +
        '<stop offset="100%" style="stop-color:rgb(48,67,61);' +
        'stop-opacity:1"/>' +
        '</linearGradient>');

    svg.append("rect")
        .attr('width', width).attr('height', height)
        .attr('fill', 'url(#orange_red)');

    let force = d3.layout.force()
        .nodes(graph.nodes)
        .links(graph.edges)
        .size([width, height])
        .linkDistance(linkDistance)
        .charge(charge)
        .start();

    let edges_line = svg.selectAll("line")
        .data(graph.edges)
        .enter()
        .append("line")
        .style("stroke", "#aaa")
        .style("stroke-width", 2);

    let tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style("width", "400px")
        .style("color", "rgb(255,255,255)")
        .style("font-family", '"Consolas", "Bitstream Vera Sans Mono", "Courier New"')
        .text("a simple tooltip");

    let nodes_img = svg.selectAll("image")
        .data(graph.nodes)
        .enter()
        .append("image")
        .attr("width", img_w)
        .attr("height", img_h)
        .attr("data-xxx", 'xxx')
        .attr("xlink:href", function (d) {
            return d.image;
        })
        .on("mouseover", function (e) {
            // console.log(this);
            let desc = localisation[e.name] + '\\n' + localisation[e.name + '_desc'];
            //console.log(desc);
            desc = desc.replace(/\\n/g, '<br>');
            //console.log(desc);
            tooltip.html(desc);
            //console.log(tooltip);
            return tooltip.style("visibility", "visible");
        })
        .on("mousemove", function () {
            return tooltip.style("top",
                (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 25) + "px");
        })
        .on("mouseout", function () {
            return tooltip.style("visibility", "hidden");
        })
        .call(force.drag);


    force.on("tick", function () {

        graph.nodes.forEach(function (d) {
            d.x = d.x - img_w / 2 < 0 ? img_w / 2 : d.x;
            d.x = d.x + img_w / 2 > width ? width - img_w / 2 : d.x;
            d.y = d.y - img_h / 2 < 0 ? img_h / 2 : d.y;
            d.y = d.y + img_h / 2 > height ? height - img_h / 2 : d.y;
        });

        edges_line.attr("x1", function (d) {
            return d.source.x;
        });
        edges_line.attr("y1", function (d) {
            return d.source.y;
        });
        edges_line.attr("x2", function (d) {
            return d.target.x;
        });
        edges_line.attr("y2", function (d) {
            return d.target.y;
        });

        nodes_img.attr("x", function (d) {
            return d.x - img_w / 2;
        });
        nodes_img.attr("y", function (d) {
            return d.y - img_h / 2;
        });
    });


}

function loadData(allData) {
    const url = 'https://qunxing.huijiwiki.com/api/rest_v1/namespace/data?filter=%7B%22main_category%22%3A%22technology%22%7D&keys=%7B%22key%22%3A1%2C%22prerequisites%22%3A1%2C%20%22_id%22%3A0%7D&pagesize=400';

    $.get(url, function (result) {
        let tech_list = [];
        if (result['_embedded'].length === 0) {
            console.log('没有请求到数据。');
            return;
        } else {
            tech_list = result['_embedded']
        }
        render(toGraphic(tech_list), allData, 3000, 3000, 50, -800, 52, 52);

        console.log('load end');
    });

}