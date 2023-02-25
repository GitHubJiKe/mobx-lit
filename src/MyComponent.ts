import { html } from "lit-html";
import { observable } from "mobx";
import defineComponent, {
    useLifeCycle,
    IFactory,
    useStyleCss,
} from "./defineComponent";

function MyComponent(this: { factory: IFactory }) {
    const state = observable.object({
        count: 0,
        showChild: false,
        color: "blue",
    });
    const onBeforeMount = useLifeCycle.call(this, "onBeforeMount");
    const onMounted = useLifeCycle.call(this, "onMounted");
    const onBeforeUpdate = useLifeCycle.call(this, "onBeforeUpdate");
    const onUpdated = useLifeCycle.call(this, "onUpdated");
    const setCss = useStyleCss.call(this);
    setCss(() => {
        return `.component{color:${state.color}}`;
    });
    setCss(`.btn{color:yellow}`);
    onBeforeMount(() => {
        console.log("MyComponent onBeforeMount");
    });
    onMounted(() => {
        console.log("MyComponent onMounted");
    });
    onBeforeUpdate(() => {
        console.log("MyComponent onBeforeUpdate");
    });
    onUpdated(() => {
        console.log("MyComponent onUpdated");
    });
    return () =>
        html`<h1
            class="component"
            @click=${() => {
                state.count++;
                state.color = "black";
            }}
        >
            MyComponent ${state.count} <br />
            <button
                class="btn"
                @click=${() => {
                    state.showChild = !state.showChild;
                }}
            >
                toggle child
            </button>
            ${state.showChild
                ? html`<my-child msg=${state.count}></my-child>`
                : ""}
        </h1>`;
}

defineComponent("my-component", { factory: MyComponent });
