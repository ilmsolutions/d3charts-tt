export const layerdefs = ((d3) => {
    return {
        'horizontalscale' : {
            scoremarker: function(props, x){
                let {value, height, margin} = props;
                
                if(!value) return;

                let datum = this.datum().data
                , maxs = datum.map(d => +d.max)
                , total = d3.sum(maxs)
                , ivalue = +value
                , lmaxs = maxs.filter(d => d >= ivalue)    
                , lmaxedge = lmaxs[lmaxs.length - 1]
                , redge = (maxs[lmaxs.length] || 0)
                , lmaxoffset = (lmaxedge > ivalue ? lmaxedge * (lmaxedge - ivalue) / (lmaxedge - redge) : 0)
                , mvalue = (d3.sum(lmaxs.slice(0, lmaxs.length - 1)) + lmaxoffset) / total
                ;
 
                margin = margin && JSON.parse(margin);
 
                this.selectAll('g.score-marker')
                    .data([mvalue])
                    .join('g').attr('class', 'score-marker')
                    .attr('transform', d => `translate(${x(d)}, ${height - margin.bottom})`)
                    .each(function(d){ 
                        d3.select(this)
                          .selectAll('path')
                          .data([d3.symbolTriangle])
                          .join('path')
                          .each(function(dd){ 
                              let osym = d3.symbol().type(dd).size(100)
                              ;
                              d3.select(this)
                              .attr('d', osym)
                          }) 
                        ;

                        d3.select(this)
                          .selectAll('text')
                          .data(d => ['Score']).join('text')
                          .attr('transform', `translate(0, ${margin.bottom * 0.85})`)
                          .attr('text-anchor', 'middle')
                          .html(d => d)   
                        ;                       
                    })
                  
                ;
            }
        }
    }

});