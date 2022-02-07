
export const d3histogram = ((d3, commons) => {
    let {wrap} = commons;
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
             let {title, data, selected
                 , width, height, margin, xvar
                 , xlabel, ylabel, scorelabel} = props;
     
                 data = data && JSON.parse(data);
                 margin = margin && JSON.parse(margin);
                 selected = selected && parseFloat(selected);
     
                 let container = d3.select(elem)
                 , svg = container.selectAll('svg.chart')                   
                 .data([{data: data, xVar: xvar}])
                 .join('svg').attr('class', 'chart')
                 .attr('width', width).attr('height', height)
                 , ch = height - margin.top - margin.bottom 
                 ,   cw = width - margin.left - margin.right ;  
     
                 title && svg.selectAll('g.title')                
                 .data([[title]])
                 .join('g').attr('class', 'title')
                 .attr('transform', `translate(${cw / 2}, ${margin.top / 2})`)
                 .selectAll('text').data(d => d)
                 .join('text').attr('text-anchor', 'middle')
                 .html(d => d);
        
                 if(!data || data.length < 3 || !selected)
                     {
                     svg.selectAll('g.no-data')
                             .data(['Display does not have sufficient data'])
                             .join('g').attr('class', 'no-data')
                             .attr('width', width).attr('height', height - margin.top)
                             .attr('transform', `translate(0, ${margin.top})`)
                             .each(function(d){
                                 var c = d3.select(this);
             
                         c.append('rect')
                                 .attr('width', '100%')
                                 .attr('height', '100%');
                 
                         c.append('text')
                                 .attr('x', '50%').attr('y', '50%')
                                 .attr('text-anchor', 'middle')
                                 .text(d);                 
                             })
             
                     return;
                 }
     
                 data && data.sort((a, b)  => a-b);
     
                 var mean = d3.mean(data)
                 ,   deviation = d3.deviation(data)
                 ,   dist = normal_dist(mean, deviation)    
                 ,   x = d3.scaleLinear()
                           .domain(d3.extent(dist, function(d){
                               return d.q;
                           })).nice()
                           .range([margin.left, cw])
                 ,   bins = d3.histogram()
                            .domain(x.domain())
                            .thresholds(x.ticks(5))
                            (data)
                 ,   yMax = d3.max(bins, function(d){ return d.length;}) 
                 ,   yMin = d3.min(bins, function(d){ return d.length;})
                 ,   pMax = d3.max(dist, function(d){return d.p; })
                 ,   y = d3.scaleLinear()
                           .domain([0, yMax]) 
                           .range([ch, margin.top])
                 ,   p = d3.scaleLinear()
                           .domain([0, pMax])
                           .range([ch, margin.top])
                 ,   xAxis = g => g
                            .attr('transform', `translate(0, ${ch})`)
                            .call(d3.axisBottom(x).ticks(bins.length).tickSizeOuter(0))
                            .call(g => g.append('text')
                                     .attr('x', cw)
                                     .attr('y', 30)
                                     .attr('fill', 'currentColor')
                                     .attr('font-weight', 'bold')
                                     .attr('text-anchor', 'end')
                                     .text(xlabel))
                 ,   yAxis = g => g 
                             .attr('transform', `translate(${margin.left}, 0)`)
                             .call(d3.axisLeft(y).ticks(yMax))
                             .call(g => g.select('.domain').remove())
                             .call(g => g.select('.tick:last-of-type text').clone()
                                   .attr('x', 4)
                                   .attr('text-anchor', 'start')
                                   .attr('font-weight', 'bold')
                                   .text(ylabel))
                 ,   line = d3.line().x(function(d){ return x(d.q); })
                                     .y(function(d){ return p(d.p); }) 
                 ,   numberbelow = selected && data.indexOf(selected)
                 ,   numberat = selected && data.filter(d => d === selected).length
                 ,   percentile = Math.round((numberbelow + (0.5 * numberat)) * 100 / data.length )
                 ;
     
                 svg.selectAll('g.bins')
                     .data([bins])
                     .join('g').attr('class', 'bins')
                     .attr('fill', '#17becf')
                     .selectAll('rect').data(d => d)
                     .join('rect')
                     .attr('x', d => x(d.x0) + 1)
                     .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 1))
                     .attr('y', d => y(d.length))
                     .attr('height', d => y(0) - y(d.length));
     
                 svg.selectAll('g.distribution')
                     .data([[normal_dist(mean, deviation)]])
                     .join('g').attr('class', 'distribution')         
                     .attr('fill', '#e377c2')
                     .selectAll('path').data(d => d)
                     .join('path') 
                     .attr('d', line);
                     
                     
                     selected && svg.selectAll('g.selected')
                     .data([[selected]]).join('g')
                     .attr('class', 'selected')
                     .selectAll('line').data(d => d)
                     .join('line')
                     .attr('x1', d => x(d)).attr('x2', d => x(d))
                     .attr('y1', y(0)).attr('y2', y(yMax));
            
                //annotation
                 selected && svg.selectAll('g.annotation')
                     .data([selected])
                     .join('g')
                     .attr('class', 'annotation')        
                     .each(function(){
                         var a = d3.select(this)
                         ,   t = a.selectAll('text.label').data([scorelabel])
                         .join('text').attr('class', 'label')            
                         .attr('dy', 0.5)
                         .attr('text-anchor', 'start')
                         .text(d => d.format(percentile))
                         .call(wrap, margin.right)
                         , bb = t.node().getBBox()
                         ;
                        
            
                         a.selectAll('line').data([selected])
                          .join('line')
                          .attr('x1', -(cw - x(selected))).attr('x2', margin.right)
                          .attr('y1', -10).attr('y2', -10)
                          ;
             
                         a.selectAll('circle').data([selected])
                          .join('circle')
                          .attr('cx', -(cw - x(selected))).attr('cy', -10).attr('r', 5);
            
                         a.attr('transform', `translate(${cw}, ${(ch - bb.height) / 2})`)
                     })
            ;     
            
            svg.selectAll('g.axis.x')
            .data([0]).join('g').attr('class', 'axis x')
            .call(xAxis);
       
             svg.selectAll('g.axis.y')
                 .data([0]).join('g').attr('class', 'axis y')
                 .call(yAxis);
     
             
             return chart;
     
         }
     
         const normal_dist = (mean, sd) => {
             let data = [];
             for (var i = mean - 4 * sd; i < mean + 4 * sd; i += 1) {
                 let q = i
                 let p = gaussian(i, mean, sd);
                 let arr = {
                     "q": q,
                     "p": p
                 }
                 data.push(arr);
             };
             return data;
         }
         // from http://bl.ocks.org/mbostock/4349187
         // Sample from a normal distribution with mean 0, stddev 1.
         const normal = () => {
             var x = 0,
                 y = 0,
                 rds, c;
             do {
                 x = Math.random() * 2 - 1;
                 y = Math.random() * 2 - 1;
                 rds = x * x + y * y;
             } while (rds == 0 || rds > 1);
             c = Math.sqrt(-2 * Math.log(rds) / rds); // Box-Muller transform
             return x * c; // throw away extra sample y * c    
         }
         
         const pdf = (x, mean, std) => {
             return Math.exp(-0.5 * Math.log(2 * Math.PI) -
             Math.log(std) - Math.pow(x - mean, 2) / (2 * std * std)); 
         }
         //taken from Jason Davies science library
         // https://github.com/jasondavies/science.js/
         const gaussian = (x, mean, sd) => {
             var gaussianConstant = 1 / Math.sqrt(2 * Math.PI)
             ;
         
             x = (x - mean) / sd;
             return gaussianConstant * Math.exp(-.5 * x * x) / sd;
         }
     
         
         return chart;
    }
});

  