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
              ,value ,layers, interpolatetype, tooltip   
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
 
         let ttip = tooltip && commons.tooltip()
         , mouseover = ttip && ((d) => {
             ttip.content(tooltip(d)).showtip();
         })
         , mouseout = ttip && (() => ttip.hidetip())
         , x = d3.scaleLinear([0, 1], [margin.left, width - margin.right]);
 
         color = color || (colorgen && colorgen(data, 'name')) ||  
                        horizontalscaleColorGen(data, interpolatetype)
        ;
        
        svg.selectAll('g.scale')
         .data([stack])
         .join('g').attr('class', 'scale')  
         .attr("font-family", "sans-serif")
         .attr("font-size", 12)   
         .selectAll('g.level')     
         .data(d => d)
         .join('g').attr('class', 'level')
         .attr('transform', dd => `translate(${[x(dd.startValue), 0]})`)
         .each(function(d, i, list){
             let elem = d3.select(this);
 
 
             elem.selectAll("rect")
             .data([d])
             .join("rect")
                 .attr("fill", dd => color(dd.name))
                 .attr("y", margin.top)
                 .attr("width", dd => x(dd.endValue) - x(dd.startValue))
                 .attr("height", ch)
                 .attr("opacity", opacity)
                 .filter(() => { return i < list.length - 1})
                 .attr("stroke", "white")
                 .attr("stroke-dasharray", (dd) => {
                    let _w = x(dd.endValue) - x(dd.startValue);
                    return `${[0, _w, ch, _w]}`;
                 })
                 ;
 
             elem.selectAll("text")
                 .data([d].filter(dd => x(dd.endValue) - x(dd.startValue) > 50))
                 .join("text")
                 .attr("opacity", "opacity")
                 .attr('fill', dd => pickBestContrast(color(dd.name), ['#fff', '#000'])) 
                 .attr("transform", "translate(6, 6)")
                 .call(text => text.append("tspan")
                     .attr("y", "0.7em")
                     .attr("font-weight", "bold")
                     .text(dd => dd.name))
                 .call(text => text.append("tspan")
                     .attr("x", 0)
                     .attr("y", "1.7em")
                     .attr("fill-opacity", 0.7)
                     .text(dd => dd.range));   
 
               ttip && elem
                  .on('touchmove mousemove', mouseover)
                  .on('touchend mouseleave', mouseout)
                  .style('cursor', 'pointer')
                
         })
 
         config.layerdefs && layers && Object.keys(config.layerdefs)
         .filter(lyr => layers.indexOf(lyr) >= 0)
         .map(lyr => {
               config.layerdefs[lyr].call(svg, props, x);
           });  
      }
 
      
      return chart;
    }
 });
  