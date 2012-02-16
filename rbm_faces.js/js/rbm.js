var params_loading = 0;

function RBM(n_visibles,
             n_hiddens,
             W,
             b,
             c,
             visibles_canvas,
             hiddens_canvas)
{
    this.n_visibles = n_visibles;
    this.n_hiddens = n_hiddens;

    this.W = this._load_array(W, n_hiddens*n_visibles);
    this.b = this._load_array(b, n_visibles);
    this.c = this._load_array(c, n_hiddens);
    
    this.visibles_context = visibles_canvas.get(0).getContext("2d");
    this.hiddens_context = hiddens_canvas.get(0).getContext("2d");
    
	// Scale up to fit the canvas
	var v_scaling =
		Math.sqrt(visibles_canvas.width()*visibles_canvas.height()/n_visibles);
	var h_scaling =
		Math.sqrt(hiddens_canvas.width()*hiddens_canvas.height()/n_hiddens);
	this.visibles_context.setTransform(v_scaling, 0, 0, v_scaling, 0, 0);
	this.hiddens_context.setTransform(h_scaling, 0, 0, h_scaling, 0, 0);
	this.visibles_columns = visibles_canvas.width() / v_scaling;
	this.hiddens_columns = hiddens_canvas.width() / h_scaling;

    this.v = new Array(n_visibles);
    this.h = new Array(n_hiddens);

	for (var i = 0; i < this.v.length; i++) {
		this.v[i] = 0;
	}
	
	this.reset = false;
}

RBM.prototype.sample_h = function(v)
{
    var h = new Array(this.n_hiddens);
    
    for (var i = 0; i < this.n_hiddens; i++)
    {
        var a = this.c[i];
        
        for (var j = 0; j < this.n_visibles; j++)
        {
            a += v[j] * this.W[i * this.n_visibles + j];
        }
        
        a = 1.0 / (1.0 + Math.exp(-a));
        
        var row = i % this.hiddens_columns;
        var column = Math.floor(i / this.hiddens_columns);
        
        if (a > Math.random()) {
            this.hiddens_context.fillStyle = "rgb(255, 255, 255)";
            this.hiddens_context.fillRect(row, column, 1, 1);
            h[i] = 1;
        }
        else {
        	this.hiddens_context.fillStyle = "rgb(0, 0, 0)";
            this.hiddens_context.fillRect(row, column, 1, 1);
            h[i] = 0;
        }
    }
    
    return h;
}

RBM.prototype.sample_v = function(h, use_mean)
{
    var v = new Array(this.n_visibles);
    
    for (var i = 0; i < this.n_visibles; i++)
    {
        var a = this.b[i];
        
        for (var j = 0; j < this.n_hiddens; j++)
        {
            a += h[j] * this.W[j * this.n_visibles + i];
        }
        
        var row = i % this.visibles_columns;
        var column = Math.floor(i / this.visibles_columns);
        
		if (use_mean === undefined || use_mean == false) {
			a = 1.0 / (1.0 + Math.exp(-a));
			
			if (a > Math.random()) {
                this.visibles_context.fillStyle = "rgb(255, 255, 255)";
                this.visibles_context.fillRect(row, column, 1, 1);
                v[i] = 1;
            }
            else {
            	this.visibles_context.fillStyle = "rgb(0, 0, 0)";
                this.visibles_context.fillRect(row, column, 1, 1);
                v[i] = 0;
            }
		}
		else {
			var intensity = Math.floor((1.0 / (1.0 + Math.exp(-a)) + 0.05) * 255);
			
			this.visibles_context.fillStyle =
				"rgb(" + intensity + ", " + intensity + ", " + intensity + ")";
            this.visibles_context.fillRect(row, column, 1, 1);
			
            v[i] = a;
		}
    }
    
    return v;
}

RBM.prototype.gibbs = function()
{
	if (this.reset) {
		for (var i = 0; i < this.v.length; i++) {
			this.v[i] = 0;
		}
		
		this.reset = false;
	}
	
    this.h = this.sample_h(this.v);
    this.v = this.sample_v(this.h);
}

RBM.prototype.ready = function()
{
    return params_loading == 0;
}

RBM.prototype._load_array = function (filename, length)
{
	var res = new Array(length);
	
	if (params_loading == 0) {
	    $.prettyLoader();
	}
	
	params_loading += 1;
	
	$.get(filename, function (view) {
			for(var i = 0; i < length; i++) {
				res[i] = view.getFloat32();
			}
			
			params_loading -= 1;
			
			if (params_loading == 0) {
			    $.prettyLoader.hide();
			}
	  },
	  'dataview'
	);
	
	return res;
}