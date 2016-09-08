import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';

$(document).ready(function() {
	$(document).on('mouseenter', '.removeItem', function() {
		$(this).css('background-color', 'white');
	});
	$(document).on('mouseleave', '.removeItem', function() {
		$(this).css('background-color', '');
	});
	
});

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = { stockList: [], timeFrame: "" }; //default for debugging, should be empty array
		this.submitStock = this.submitStock.bind(this);
		this.removeStock = this.removeStock.bind(this);
	}
	
	submitStock(code) { //add stock to tracking list
		var arr = this.state.stockList.slice();
		var today = new Date();
		var dateStr = (today.getYear()+1900-1) + "-" + formatNum(today.getMonth()+1) + "-" + formatNum(today.getDate()); //for one year
		$.ajax({
					url:'https://www.quandl.com/api/v3/datasets/WIKI/' + code +'.json?api_key=fsT69Hcx4jABAz-GygyD' + '&start_date=' + dateStr,
					dataType:'json',
					success:function(data) {
						var obj = { code: data.dataset.dataset_code, name: data.dataset.name, value: data.dataset.data[0][1], data: data.dataset.data };
						arr.push(obj);
						this.setState({ stockList: arr.slice() });
					}.bind(this),
					failure:function(err) {
						console.log("Failure getting stock data.");
					}
					
					
				});
	}
	
	removeStock(code) { //remove stock from list
		var index = -1;
		var arr = this.state.stockList.slice();
		for (var i=0; i<arr.length; i++) {
			if (arr[i].code == code) {
				index = i;
			}
		}
		arr.splice(index,1); 
		this.setState({ stockList: arr.slice() });
	}
	
	render() {
		return <div className="container">
			<Chart stockList={this.state.stockList.slice()} />
			<ToolBar stockList={this.state.stockList.slice()} submitStock={this.submitStock} removeStock={this.removeStock} />
		</div>;
	}
}

class Chart extends React.Component {
	constructor(props) {
		super(props);
	}
	
	componentDidUpdate() { //draw graph
		d3.select('svg').remove();
		if (this.props.stockList.length>0) {
				var margin = { top:25, right:25, bottom:25, left:25 };
				var width = $('.chartContainer').width() - margin.left - margin.right;
				var height = $('.chartContainer').height() - margin.top - margin.bottom;
				
				var svg = d3.select('.chartContainer').append('svg')
				.attr('width', width + margin.left + margin.right)
				.attr('height', height + margin.top + margin.bottom)
				.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
				
				
				var dataObjs = this.props.stockList.slice();
				
				var arr = dataObjs.map(function(item) {
					return { data: item.data, name: item.code }; 	
						
				});
				
				arr = arr.map(function(item) { //array that holds stock info
					var obj; 
					var ret = [];
					for (var i=0; i<item.data.length; i++) {
						obj = { name: item.name, date: item.data[i][0], value: item.data[i][1] };
						ret.push(obj);
					}
					return ret.slice();
				});
				
				var allValues = [];  //for calculating min/max 
				var allDates = [];
				
				for (var i=0; i<arr.length; i++) {
					for (var j=0; j<arr[i].length; j++) {
						allValues.push(arr[i][j].value);
						allDates.push(arr[i][j].date);
					}
				}
				
				var maxValue = d3.max(allValues);
				var minValue = d3.min(allValues);
				
				var formatDate = d3.time.format('%Y-%m-%d'); //for creating Date obj from strings
				
				var x = d3.time.scale().domain(d3.extent(allDates, function(d) { return formatDate.parse(d); })).range([0,width]); //x scale
				var y = d3.scale.linear().domain([minValue, maxValue]).range([height,0]); //y scale
				
				var xAxis = d3.svg.axis().scale(x).orient('bottom').outerTickSize(0).tickFormat(d3.time.format("%B '%y")).ticks(5).innerTickSize(-height).outerTickSize(0);
				var yAxis = d3.svg.axis().scale(y).orient('left').outerTickSize(0).ticks(5).innerTickSize(-width).outerTickSize(0);
				
				var line = d3.svg.line().x(function(d) { return x(formatDate.parse(d.date)); }).y(function(d) { return y(d.value); });
				
				svg.append('g').attr('class', 'axis xAxis').attr('transform', 'translate(0,' + parseInt(height) + ')').call(xAxis); //add the x axis
				svg.append('g').attr('class', 'axis yAxis').call(yAxis); //add the y axis
				
				arr.forEach(function(data) {
					svg.append('path').attr('class', 'line').attr('d', line(data));
				});
			
		}
		
	}
	
	render() {
		if (this.props.stockList.length<=0) {
			return (
				<div className="chartContainer">
					<h2>NO STOCKS SELECTED</h2>
				</div>
				);
		}
		else {
			return <div className="chartContainer"></div>;
		}
	}
}

class ToolBar extends React.Component {
	constructor(props) {
		super(props);
		this.getStockBoxes = this.getStockBoxes.bind(this);
	}
	
	getStockBoxes() {
		return this.props.stockList.map(function(item) {
			return <Box name={item.name} code={item.code} value={item.value} key={item.code} removeStock={this.props.removeStock} />;
		}.bind(this));
	}
	
	render() {
		var codeArr = this.props.stockList.map(function(stock) {
			return stock.code;
		});
		return <div className="toolBar">
			<form id="stockForm" onSubmit={(event) => { event.preventDefault(); var sym = $('#stockInput').val().toUpperCase(); if (codeArr.indexOf(sym)== -1) {this.props.submitStock(sym); } }}>
				<input id="stockInput" placeholder="Enter Stock Code" type='text'></input>
				<div id="listHolder">{this.getStockBoxes()}</div>
			</form>
		</div>;
	}
}

class Box extends React.Component {
	constructor(props) {
		super(props);
	}
	
	render() {
			return (
				<div className='listItem'>
					<span className='codeName'>{this.props.code + " - "}</span><span className='stockValue'>{"[$" + this.props.value + "]"}</span><br/>
					<span className='extName'>{this.props.name}</span><br/>
					<div onClick={() => this.props.removeStock(this.props.code)} className='removeItem'>x</div>
				</div>
				);
				
	}
}

function formatNum(num) { //helper function for padding numbers
	if (Math.floor(num/10) == 0) {
		return "0" + num.toString();
	}
	else {
		return num.toString();
	}
}

ReactDOM.render(<App/>, document.querySelector(".app"));