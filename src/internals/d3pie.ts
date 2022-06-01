export const d3pie = ((d3, commons) => {
   const {wrap, collisiondetection} = commons;
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
        let {title, data, width, height, margin
            , xvar, yvar, color : defaultColor, valueformatter, colorgen      
            , interpolatetype       
        } = props;
     
        data = data && JSON.parse(data);
        margin = margin && JSON.parse(margin);
        width = width || elem.getBoundingClientRect().width;
        height = height || width;
 
        let svg = d3.select(elem).selectAll('svg.chart')                   
            .data([{data: data, xVar: xvar}])
            .join('svg').attr('class', 'chart')
            .attr('width', width).attr('height', height)
            .attr("viewBox", [-width / 2, -height / 2.5, width, height])        
        , ch = height - margin.top - margin.bottom 
        ,   cw = width - margin.left - margin.right
        , r = Math.min(cw, ch) / 2
        , color = (colorgen && colorgen(data, xvar, interpolatetype)) || defaultColor
        ; 
     
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
        
        let pie = d3.pie().value(d => d[yvar])
        ,   arc = d3.arc().innerRadius(r * 0.3).outerRadius(r * 0.45)
        ,   oarc = d3.arc().innerRadius(r * 0.48).outerRadius(r * 0.48)
        ,   pline = d => {
             var pos = oarc.centroid(d);
             pos[0] = r * 0.51 * (midangle(d) < Math.PI ? 1 : -1);
             return [arc.centroid(d), oarc.centroid(d), pos];
        }
        , lw = (width - (2 * r * 0.5)) / 2
        ,   lbltransform = d => {
            var pos = oarc.centroid(d);
            pos[0] = r * 0.52 * (midangle(d) < Math.PI ? 1 : -1);
            return `translate(${pos})`;
        };
      
          svg.selectAll('g.arcs')
             .data([data])
             .join('g').attr('class', 'arcs')
             .attr('stroke', 'white')
             .selectAll('path').data(d => pie(d))
             .join('path').attr('d', arc)
             .attr('fill', d => color(d.data[xvar], 'value'));
    
        svg.selectAll('g.lines')
            .data([data])
            .join('g').attr('class', 'lines')
            .selectAll('polyline').data(d => pie(d))
            .join('polyline')
            .attr('points', pline);
    
        svg.selectAll('g.labels')
             .data([data])
             .join('g').attr('class', 'labels')
             .selectAll('text').data(d => pie(d))
             .join('text').attr('dy', '.35em')
             .html(d => valueformatter(d))
             .attr('transform', lbltransform)
             .style('text-anchor', d => midangle(d) < Math.PI ? 'start' : 'end')
             .call(wrap, lw).call(collisiondetection);         
     }

     const midangle = d => d.startAngle + (d.endAngle - d.startAngle) / 2;
     return chart;
   }
});
 