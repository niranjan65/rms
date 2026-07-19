frappe.provide("frappe.dashboards.chart_sources");
// console.log(frappe.dashboards.chart_sources)

// frappe.dashboards.chart_sources["RMA Chart Source"] = {
//     method: "rms.chart_api.rnr_chart"
// };
frappe.dashboards.chart_sources["RMA Chart Source"] = {
    method: "rms.chart_api.rnr_chart",

    transform: function (response) {
        return response.message.data;   
    }
};