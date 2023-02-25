import { makeAutoObservable } from "mobx";
import defineComponent, { WebComponent } from "./defineComponent";
import { html } from "lit-html";

class MyChild implements WebComponent {
    constructor() {
        makeAutoObservable(this);
    }

    style = () => `
    .child{
background-color:${this.state.bgc};
    }
    `;

    state = { count: 0, bgc: "red" };

    increase = (e: Event) => {
        e.stopPropagation();
        this.state.count++;
        this.state.bgc = "green";
    };

    render(props: { msg: string }) {
        return html`<h2 class="child" @click=${this.increase}>
            MyChild ${this.state.count} ${props.msg}
        </h2>`;
    }

    onBeforeMount() {
        console.log("MyChild onBeforeMount");
    }

    onMounted() {
        console.log("MyChild onMounted");
    }

    onBeforeUpdate() {
        console.log("MyChild onBeforeUpdate");
    }

    onUpdated() {
        console.log("MyChild onUpdated");
    }

    onUnmounted() {
        console.log("MyChild onUnmounted");
    }
}

defineComponent("my-child", { props: ["msg"], factory: MyChild });
