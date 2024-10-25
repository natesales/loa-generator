<script>
    export let value = "bgp";
</script>

<main>
    <input type="radio" id="bgp" name="x" checked={value === "bgp"} on:change={() => { value = "bgp" }}/>
    <label for="bgp">BGP</label>

    <input type="radio" id="xc" name="x" checked={value === "xc"} on:change={() => { value = "xc" }}/>
    <label for="xc">Cross Connect</label>
</main>

<style>
    main {
        width: fit-content;
        overflow: hidden;
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        margin-right: 6px;
        margin-bottom: 6px;
        border-radius: 6px;
        outline: none;
        background: var(--background);
    }

    input {
        display: none !important;
    }

    label {
        padding: 10px 16px !important;
        margin: 0 !important;
        cursor: pointer;
        transition: all 0.3s;
    }

    label:hover {
        background: var(--button-hover);
    }

    input:checked + label {
        background: var(--button-base);
    }
</style>