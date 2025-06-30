// Copyright (c) 2025, Anantdv and contributors
// For license information, please see license.txt

frappe.query_reports["Physical Screening Script report"] = {
	"filters": [
		{
			"fieldname": "item",
			"label": __("Item"),
			"fieldtype": "Data",
			"width": 200
		},
		{
			"fieldname": "customer",
			"label": __("Customer"),
			"fieldtype": "Data",
			"width": 200
		},
		// {
		// 	"fieldname": "status",
		// 	"label": __("Status"),
		// 	"fieldtype": "Select",
		// 	"options": [
		// 		'Ok',
		// 		'Not Ok',
		// 		],
		// 	"width":120,
		// 	"default":'Not Ok'
		// },
		{
			"fieldname": "issue",
			"label": __("Issue"),
			"fieldtype": "Link",
			"option" : "Item Quality Checklist",
			"width": 200
		},
		{
			"fieldname": "remark",
			"label": __("Remark"),
			"fieldtype": "Data",
			"width": 300
		}
	]
};
