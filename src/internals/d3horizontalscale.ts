export const d3horizontalscale = ((d3, commons) => {
   const {wrap, collisiondetection, horizontalscaleColorGen, pickBestContrast} = commons;
   let defaults = {
    jsdom: false
   };   
   return (config) => {
    config = Object.assign(defaults, config);

    function chart(selection, opts?){
        opts = Object.assign({}, config, opts || {});
        selection.each(function(props){
           draw(this, Object.assign({}, opts, props));
        })
        return chart;
     }   

     const draw = (elem, props) => {
        let {title, data, width, height, margin, selected
             , yvar, color, type, valueformatter, colorgen     
             , value, layers, interpolatetype 
        } = props;
    
        let opacity = d => selected && d.name !== selected ? 0.5 : 1;

        data = data && JSON.parse(data);
        margin = margin && JSON.parse(margin);

        let svg = d3.select(elem).selectAll('svg.chart')                   
            .data([{data: data}])
            .join('svg').attr('class', 'chart')
            .attr('width', width).attr('height', height)               
        , ch = height - margin.top - margin.bottom 
        , cw = width - margin.left - margin.right
        , r = Math.min(cw, ch) / 2; 
    
    
        title && svg.selectAll('g.title')                
        .data([[title]])
        .join('g').attr('class', 'title')
        .selectAll('text').data(d => d)
        .join('text').attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .html(d => d)
        .call(wrap, r * 0.2)
        .each(function(d) {
            var bb = this.getBBox();
            d3.select(this).attr('transform', `translate(${[0, -(bb.height / 3)]})`)
        })
        ;      
        
        //no-data check
        if(!data) return;
        
        let stack = ((vcol) => {
            const total = d3.sum(data, d => d[vcol]);
            let value = 0;
            return data.map((d, i) => ({
              name: d.name,
              range: `${d[vcol]}-${(i < data.length - 1 ? data[i+1][vcol] : 0)}${/percent/i.test(type) ? '%' : ''}`,
              value: d[vcol] / total,
              startValue: value / total,
              endValue: (value += +d[vcol]) / total
            }));
        })(yvar);
        let x = d3.scaleLinear([0, 1], [margin.left, width - margin.right]);

        color = color || (colorgen && colorgen(data, 'name')) ||  
                       horizontalscaleColorGen(data, interpolatetype)
       ;
       
       svg.selectAll('g.scale')
        .data([stack])
        .join('g').attr('class', 'scale')          
        .attr("stroke", "white")
        .selectAll("rect")
        .data(d => d)
        .join("rect")
            .attr("fill", d => color(d.name))
            .attr("x", d => x(d.startValue))
            .attr("y", margin.top)
            .attr("width", d => x(d.endValue) - x(d.startValue))
            .attr("height", ch)
            .attr("opacity", opacity)
        .append("title")
        .text(d => `${d.name}\n${d.range}`);

        svg.selectAll('g.labels')
        .data([stack])
        .join('g').attr('class', 'labels')           
        .attr("font-family", "sans-serif")
        .attr("font-size", 12)
        .selectAll("text")
        .data(d => d.filter(dd => x(dd.endValue) - x(dd.startValue) > 50))
        .join("text")
        .attr("opacity", "opacity")
        .attr('fill', d => pickBestContrast(color(d.name), ['#fff', '#000']))
       // .attr("fill", d => d3.lab(color(d.name)).l < 50 ? "white" : "black")
        .attr("transform", d => `translate(${x(d.startValue) + 6}, 6)`)
        .call(text => text.append("tspan")
            .attr("y", "0.7em")
            .attr("font-weight", "bold")
            .text(d => d.name))
        .call(text => text.append("tspan")
            .attr("x", 0)
            .attr("y", "1.7em")
            .attr("fill-opacity", 0.7)
            .text(d => d.range));        

        config.layerdefs && layers && Object.keys(config.layerdefs)
        .filter(lyr => layers.indexOf(lyr) >= 0)
        .map(lyr => {
              config.layerdefs[lyr].call(svg, props, x);
        });                 
     }

     return chart;
   }
});
 