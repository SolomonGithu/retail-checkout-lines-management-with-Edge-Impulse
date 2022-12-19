window.onload = function(){
  can_request_data = true; // wait until the page has fully loaded so that people counts can be processed
}

const request_people_count_frequency_ms = 1000; // sets the frequency of the collecting and alayzing people counts
var can_request_data = false;
const request_customers_count_url = './get_cashier_customers';
var cashier1_customers = 0; //variables to store No of bounding boxes received from the request
var cashier2_customers = 0;
var cashier3_customers = 0;

var cashier1_count = document.getElementById("cashier1_count"); // spans counts of people at each cashier
var cashier2_count = document.getElementById("cashier2_count");
var cashier3_count = document.getElementById("cashier3_count");

var cashier1_checkout_percent = 0; //stores the % distribution of people count at each cashier
var cashier2_checkout_percent = 0;
var cashier3_checkout_percent = 0;

const max_single_checkoutline_threshold = 0.51; // threshold is the max percent of people a checkout line needs to have wrt the rest

var cashier1_border = document.getElementById("cashier1"); // used to set colors of the gauges
var cashier2_border = document.getElementById("cashier2");
var cashier3_border = document.getElementById("cashier3");

function fetch_customers_count(){ // gets customers number from python
  fetch(request_customers_count_url)
    .then((response) => response.json())
    .then((data) => 
      {
        console.log(data);
        cashier1_customers = data['cashier1'];
        cashier2_customers = data['cashier2'];
        cashier3_customers = data['cashier3'];

        console.log("-------------------------------------------------------------");
        console.log("cashier1_customers : " + cashier1_customers);
        console.log("cashier2_customers : " + cashier2_customers);
        console.log("cashier3_customers : " + cashier3_customers);
        console.log("-------------------------------------------------------------");  

        show_customer_counts();

      }
    ); 
}

function show_customer_counts(){ // show counts on html page
  cashier1_count.innerHTML = cashier1_customers
  cashier1_count.style.display = "block";

  cashier2_count.innerHTML = cashier2_customers
  cashier2_count.style.display = "block";

  cashier3_count.innerHTML = cashier3_customers
  cashier3_count.style.display = "block";

  get_checkout_distribution();
}

function get_checkout_distribution(){ // computes the % distribution of people counts at each cashier
  cashier1_checkout_percent = cashier1_customers / (cashier1_customers + cashier2_customers + cashier3_customers) ;
  cashier2_checkout_percent = cashier2_customers / (cashier1_customers + cashier2_customers + cashier3_customers);
  cashier3_checkout_percent = cashier3_customers / (cashier1_customers + cashier2_customers + cashier3_customers);

  // round off to 2dp
  cashier1_checkout_percent = cashier1_checkout_percent.toFixed(2);
  cashier2_checkout_percent = cashier2_checkout_percent.toFixed(2);
  cashier3_checkout_percent = cashier3_checkout_percent.toFixed(2);

  console.log("-------------------------------------------------------------");
  console.log("cashier1_checkout_percent : " + cashier1_checkout_percent);
  console.log("cashier2_checkout_percent : " + cashier2_checkout_percent);
  console.log("cashier3_checkout_percent : " + cashier3_checkout_percent);
  console.log("-------------------------------------------------------------");

  // check if no bounding boxes are found 
  if (isNaN(cashier1_checkout_percent) && isNaN(cashier2_checkout_percent) && isNaN(cashier3_checkout_percent)){
    // display borderes with black color
    set_default_border_colors();
  }
  else{ //set border colors based on count
    set_border_colors();
  }
}

function set_border_colors(){ // sets the border colors wrt the % distribution

  // -----------------------------------------------------------------
  // -- if cashier 1 has highest set border color to red
  if (cashier1_checkout_percent >= max_single_checkoutline_threshold){
    cashier1_border.style.borderColor = "red";

    // -- if cashier 2 has higher than cashier 3 set border to orange
    if (cashier2_checkout_percent > cashier3_checkout_percent){
      cashier2_border.style.borderColor = "orange";
      cashier3_border.style.borderColor = "green"; // set cashier 3 to be green
    }
    // -- if cashier 2 has less than cashier 3 set border to green
    else if (cashier2_checkout_percent < cashier3_checkout_percent){
      cashier2_border.style.borderColor = "green";
      cashier3_border.style.borderColor = "orange"; // set cashier 3 to be orange
    }
    // -- if cashier 2 & 3 have equal checkout set both borders to orange
    else if (cashier2_checkout_percent == cashier3_checkout_percent){
      cashier2_border.style.borderColor = "orange";
      cashier3_border.style.borderColor = "orange";
    }
  }
  // -----------------------------------------------------------------


  // -----------------------------------------------------------------
  // -- if cashier 2 has highest set border color to red
  if (cashier2_checkout_percent >= max_single_checkoutline_threshold){
    cashier2_border.style.borderColor = "red";

    // -- if cashier 1 has higher than cashier 3 set border to orange
    if (cashier1_checkout_percent > cashier3_checkout_percent){
      cashier1_border.style.borderColor = "orange";
      cashier3_border.style.borderColor = "green"; // set cashier 3 to be green
    }
    // -- if cashier 1 has less than cashier 3 set border to green
    else if (cashier1_checkout_percent < cashier3_checkout_percent){
      cashier1_border.style.borderColor = "green";
      cashier3_border.style.borderColor = "orange"; // set cashier 3 to be orange
    }
    // -- if cashier 1 & 3 have equal checkout set both borders to orange
    else if (cashier1_checkout_percent == cashier3_checkout_percent){
      cashier1_border.style.borderColor = "orange";
      cashier3_border.style.borderColor = "orange";
    }

  }
  // -----------------------------------------------------------------


  // -----------------------------------------------------------------
  // -- if cashier 3 has highest set border color to red
  if (cashier3_checkout_percent >= max_single_checkoutline_threshold){
    cashier3_border.style.borderColor = "red";

    // -- if cashier 1 has higher than cashier 2 set border to orange
    if (cashier1_checkout_percent > cashier2_checkout_percent){
      cashier1_border.style.borderColor = "orange";
      cashier2_border.style.borderColor = "green"; // set cashier 3 to be green
    }
    // -- if cashier 1 has less than cashier 2 set border to green
    else if (cashier1_checkout_percent < cashier2_checkout_percent){
      cashier1_border.style.borderColor = "green";
      cashier2_border.style.borderColor = "orange"; // set cashier 3 to be orange
    }
    // -- if cashier 1 & 2 have equal checkout set both borders to orange
    else if (cashier1_checkout_percent == cashier2_checkout_percent){
      cashier1_border.style.borderColor = "orange";
      cashier2_border.style.borderColor = "orange";
    }

  }
  // -----------------------------------------------------------------
 
  // reset counts
  cashier1_customers = 0; //variables to store No of bounding boxes received from the request
  cashier2_customers = 0;
  cashier3_customers = 0;

  cashier1_checkout_percent = 0; //stores the % distribution of people count at each cashier
  cashier2_checkout_percent = 0;
  cashier3_checkout_percent = 0;
}

function set_default_border_colors(){
  console.log("setting circle borders to default color")
  cashier1_border.style.borderColor = "#14151A";
  cashier2_border.style.borderColor = "#14151A";
  cashier3_border.style.borderColor = "#14151A";
}

function foo() {
  if (can_request_data){
    fetch_customers_count();
  }
  setTimeout(foo, request_people_count_frequency_ms); // obtain people counts every second
}
foo();