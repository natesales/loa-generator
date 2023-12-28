<script>
    import GitHubCat from "../components/GitHubCat.svelte";
    import ModeSwitch from "../components/ModeSwitch.svelte";
    import ButtonBar from "../components/ButtonBar.svelte";
    import {onMount} from "svelte";

    let mode = "bgp";

    // Universal
    let contactName = "";
    let contactEmail = "";
    let contactPhone = "";
    let date = "";
    let notes = "";
    let logo;

    // BGP
    let asn = "";
    let networkName = "";
    let peerASN = "";
    let peerName = "";
    let prefixes = "";

    // Fiber
    let facility = "";
    let mediaType = "";
    let tiedown = "";

    function init() {
        date = new Date().toISOString().split("T")[0];

        // Get url params
        let url = new URL(window.location.href);
        let params = new URLSearchParams(url.search);

        if (params.has("mode")) {
            if (params.get("mode") === "bgp") {
                mode = "bgp";
                if (params.has("asn")) {
                    asn = params.get("asn");
                }
            } else if (params.get("mode") === "xc") {
                mode = "xc";
                if (params.has("facility")) {
                    facility = params.get("facility");
                }
                if (params.has("mediaType")) {
                    mediaType = params.get("mediaType");
                }
                if (params.has("tiedown")) {
                    tiedown = params.get("tiedown");
                }
            }
        }

        if (params.has("networkName")) {
            networkName = params.get("networkName");
        }
        if (params.has("peerName")) {
            peerName = params.get("peerName");
        }
        if (params.has("contactName")) {
            contactName = params.get("contactName");
        }
        if (params.has("contactEmail")) {
            contactEmail = params.get("contactEmail");
        }
        if (params.has("contactPhone")) {
            contactPhone = params.get("contactPhone");
        }
    }

    onMount(init);

    function loadPeeringDB() {
        if (asn !== "") {
            fetch("https://www.peeringdb.com/api/net?asn=" + asn)
                .then(resp => resp.json())
                .then(data => {
                    if (data.data.length === 1) {
                        networkName = data.data[0].name;
                    }
                });
        }

        if (peerASN !== "") {
            fetch("https://www.peeringdb.com/api/net?asn=" + peerASN)
                .then(resp => resp.json())
                .then(data => {
                    if (data.data.length === 1) {
                        peerName = data.data[0].name;
                    }
                });
        }
    }

    function loadImage(e) {
        logo.style.display = "block";

        let reader = new FileReader();
        reader.onload = function (event) {
            logo.src = event.target.result;
        }
        reader.readAsDataURL(e.target.files[0]);
    }

    function opening(format) {
        return new Date(date).toLocaleDateString() + `

To whom it may concern,

`
    }

    function conclusion(format) {
        return `${notes === "" ? "" : "\n" + notes + "\n"}
This document certifies that I am authorized to execute this Letter of Authorization (LoA). Authorization may be revoked at any time by ${networkName}. Should you have questions about this request, email ${contactEmail}${contactPhone !== "" ? " or call " + contactPhone : ""}.

Sincerely,
${contactName}
`
    }

    function generateBGP(format) {
        return `This letter serves to authorize AS${peerASN} (${peerName}) to announce the following IP address blocks:

${prefixes}
`
    }

    function generateXC(format) {
        return `This letter serves to authorize ${peerName} for the limited purpose of installing a cross connect to ${networkName}.

Facility: ${facility}
Tiedown: ${tiedown}
Media Type: ${mediaType}
`
    }

    function validateForm() {
        let ok = true;
        document.getElementById("form").querySelectorAll("[required]").forEach(function (i) {
            if (!ok) return;
            if (!i.value || i.value === "") ok = false;
        })
        if (!ok) {
            alert("Please complete all required fields");
        }
        return ok;
    }

    function generate(format) {
        return opening(format) + (mode === "bgp" ? generateBGP(format) : generateXC(format)) + conclusion(format);
    }

    function filename() {
        let today = new Date();
        return `LoA-${peerName.toUpperCase().replace(/[^a-z0-9]/gi, '-')}-${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}`
    }

    // Handlers

    function saveText() {
        if (!validateForm()) return;
        let loa_body = "Letter of Authorization\n\n" + generate(false);
        let target_text = "data:text/plain;charset=utf-8," + encodeURIComponent(loa_body);
        let element = document.createElement("a");
        element.style.display = "none";
        element.setAttribute("href", target_text);
        element.setAttribute("download", filename() + ".txt");
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    function savePDF() {
        if (!validateForm()) return;

        let doc = new jspdf.jsPDF();

        let header_height = 20;
        let body_height = 30;

        // Image
        if (logo.src !== "") {
            header_height = 50;
            body_height = 60;

            let target_height = 20;
            let target_width = (logo.clientWidth / logo.clientHeight) * target_height;
            doc.addImage(logo.src, 20, 20, target_width, target_height, "NONE", 0);
        }

        doc.setFontSize(20);
        doc.text(20, header_height, "Letter of Authorization");

        doc.setFontSize(12);
        doc.text(20, body_height, doc.splitTextToSize(generate(true), 180));
        doc.save(filename() + ".pdf");
    }

    function reset() {
        // Universal
        contactName = "";
        contactEmail = "";
        contactPhone = "";
        date = "";
        notes = "";
        logo.src = "";
        logo.style.display = "none";

        // BGP
        asn = "";
        networkName = "";
        peerASN = "";
        peerName = "";
        prefixes = "";

        // XC
        facility = "";
        mediaType = "";
        tiedown = "";

        init();
    }
</script>

<svelte:head>
    <title>LoA Generator</title>
    <script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.0/dist/jspdf.umd.min.js"></script>
    <link rel="stylesheet" href="water.min.css">
</svelte:head>

<main>
    <GitHubCat/>

    <h1>LoA Generator</h1>

    <div id="form">
        <ModeSwitch bind:value={mode}/>

        {#if mode === "bgp"}
            <label>
                ASN*
                <input bind:value={asn} on:blur={loadPeeringDB} placeholder="65530" required type="number">
            </label>

            <label>
                Peer ASN*
                <input bind:value={peerASN} on:blur={loadPeeringDB} placeholder="65531" required type="number">
            </label>

            <br>
        {/if}

        <label>
            Network Name*
            <input bind:value={networkName} required type="text">
        </label>

        <label>
            Peer Name*
            <input bind:value={peerName} required type="text">
        </label>

        {#if mode === "xc"}
            <br>

            <label>
                Facility*
                <input bind:value={facility} type="text" placeholder="921 SW Washington St" required>
            </label>

            <label>
                Media Type
                <input bind:value={mediaType} type="text" placeholder="SMF LC-UPC Duplex">
            </label>

            <br>

            <label class="wide">
                Tiedown*
                <input style="width: calc(100% - 26px)" bind:value={tiedown} placeholder="MMR-A: 1.49, Port A4" type="text" required>
            </label>
        {/if}

        <br>

        <label>
            Contact Name*
            <input bind:value={contactName} placeholder="John Doe" required type="text">
        </label>

        <label>
            Contact Email*
            <input bind:value={contactEmail} placeholder="noc@example.com" required type="email">
        </label>

        <br>

        <label>
            Contact Phone
            <input bind:value={contactPhone} placeholder="+1 (123) 456 7890" type="text">
        </label>

        <label>
            Date*
            <input bind:value={date} required type="date">
        </label>

        <br>

        {#if mode === "bgp"}
            <label>
                Prefixes*
                <textarea bind:value={prefixes} placeholder="192.0.2.0/24" required></textarea>
            </label>
        {/if}

        <label class="wide">
            Notes
            <textarea bind:value={notes}></textarea>
        </label>

        <br>

        <label>
            Network Logo
            <input alt="Network Logo" type="file" on:change={loadImage}/>
        </label>

        <img bind:this={logo} style="display: none"/>

        <ButtonBar {saveText} {savePDF} {reset}/>
    </div>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    img {
        max-width: 400px;
    }

    h1 {
        margin: 25px;
    }

    .wide {
        width: 100% !important;
    }
</style>
