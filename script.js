window.onload = function () {
    // Set date selector to current date
    document.getElementById("form-date").value = moment().format("YYYY-MM-DD");

    // Fix textarea newlines
    Array.prototype.forEach.call(document.getElementsByTagName("textarea"), function (elem) {
        elem.placeholder = elem.placeholder.replace(/\\n/g, '\n');
    });
}

function form_ok() {
    let all_filled = true;
    document.getElementById("form").querySelectorAll("[required]").forEach(function (i) {
        if (!all_filled) return;
        if (!i.value || i.value === "") all_filled = false;
    })
    return all_filled;
}

function load_peeringdb_data() {
    let local_asn = document.getElementById("form-asn").value;
    if (local_asn !== undefined) {
        fetch("https://www.peeringdb.com/api/net?asn=" + local_asn)
            .then(resp => resp.json())
            .then(data => {
                if (data.data.length === 1) {
                    network = data.data[0]
                    document.getElementById("form-network-name").value = network.name;
                }
            })
    }

    let peer_asn = document.getElementById("form-peer-asn").value;
    if (peer_asn !== undefined) {
        fetch("https://www.peeringdb.com/api/net?asn=" + peer_asn)
            .then(resp => resp.json())
            .then(data => {
                if (data.data.length === 1) {
                    network = data.data[0]
                    document.getElementById("form-peer-name").value = network.name;
                }
            })
    }
}

function generate_loa() {
    let prefixes = document.getElementById("form-prefixes").value.replace(/(\r\n|\r|\n){2}/g, '$1').replace(/(\r\n|\r|\n){3,}/g, '$1\n').replace(/\n+$/, ""); // Remove duplicate newlines
    let peer_name = document.getElementById("form-peer-name").value;
    let peer_asn = document.getElementById("form-peer-asn").value.toUpperCase().replace("AS", "");
    let date = document.getElementById("form-date").value;
    let name = document.getElementById("form-network-name").value;
    let asn = document.getElementById("form-asn").value.toUpperCase().replace("AS", "");
    let contact_name = document.getElementById("form-contact-name").value;
    let contact_email = document.getElementById("form-email").value;
    let contact_phone = document.getElementById("form-phone").value;
    let notes = document.getElementById("form-notes").value.replace(/\n+$/, ""); // Remove trailing newline

    let loa_body = moment(date).format("MMMM D, YYYY") + `

To whom it may concern,

This letter serves to authorize AS` + peer_asn + ` (` + peer_name + `) to announce the following IP address blocks:

` + prefixes + `

As a representative of AS` + asn + ` (` + name + `) that is the owner of the prefix(es) and/or ASN, I hereby affirm that I'm authorized to represent and sign for this LOA.
`
    if (notes !== "") {
        loa_body += "\n" + notes + "\n"
    }

    loa_body += `
Should you have questions about this request, email ` + contact_email

    if (contact_phone !== "") {
        loa_body += " or call " + contact_phone
    }

    loa_body += `.

Sincerely,
` + contact_name

    return loa_body
}

function open_text_loa() {
    if (!form_ok()) {
        return
    }
    let loa_body = "Letter of Authorization\n\n" + generate_loa();
    window.open('data:text;base64,' + btoa(loa_body.replace(/\n/g, '\r\n')), "_blank").focus();
}

function save_pdf_loa() {
    if (!form_ok()) {
        return
    }
    let doc = new jspdf.jsPDF();
    doc.setFontSize(20);
    doc.text(20, 20, "Letter of Authorization");
    doc.setFontSize(12);
    let loa_body = generate_loa();
    doc.text(20, 30, doc.splitTextToSize(loa_body, 180));
    let peer_asn = document.getElementById("form-peer-asn").value.toUpperCase().replace("AS", "");
    doc.save("LoA_AS" + peer_asn + "_" + moment().format("MM-DD-YYYY") + ".pdf");
}
