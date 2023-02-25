import { observable, autorun } from "mobx";
import { html, render } from "lit-html";
import { isFunction, each } from "lodash-es";

export class WebComponent implements IRender {
    style!: () => string;
    render!: (props: any) => ReturnType<typeof html>;
    onBeforeMount?: () => void;
    onMounted?: () => void;
    onBeforeUpdate?: () => void;
    onUpdated?: () => void;
    onUnmounted?: () => void;
    onAttributeChange?: () => void;
    constructor(props: unknown) {}
}

export interface IRender {
    render: (props: any) => ReturnType<typeof html>;
}

type TLifeCycle = () => void;

type TLifeCycleName =
    | "onBeforeMount"
    | "onMounted"
    | "onBeforeUpdate"
    | "onUpdated"
    | "onUnmounted"
    | "onAttributeChange";

export type IFactory = (
    props: Record<string, any>,
) => () => ReturnType<typeof html>;

interface IDefineComponentOpt {
    props?: string[];
    factory: IFactory | typeof WebComponent;
}

export default function defineComponent(
    componentName: string,
    { props, factory }: IDefineComponentOpt,
) {
    let isClazz = false;
    if (isFunction(factory) && factory.prototype.render) {
        isClazz = true;
    }
    class Component extends HTMLElement {
        [x: string]: any;
        /**
         * 你必须监听这个属性。这可以通过定义observedAttributes() get 函数来实现，
         * observedAttributes()函数体内包含一个 return 语句，返回一个数组，包含了需要监听的属性名称
         */
        static get observedAttributes() {
            return props || [];
        }

        static isMounted = false;

        props!: Record<string, unknown>; // 用来收集和监听attribute的变化

        instance!: WebComponent;
        constructor() {
            super();
            if (!isClazz) {
                this.handleComponentFactory();
            } else {
                this.handleComponentClazz();
            }
        }

        private safeRunLifeCycle(name: TLifeCycleName) {
            if (!name) {
                return;
            }

            if (!this.instance) {
                return;
            }

            if (!this.instance[name]) {
                return;
            }

            if (!isFunction(this.instance[name])) {
                return;
            }

            (this.instance[name] as TLifeCycle)();
        }

        private handleComponentClazz() {
            // 1. 创建一个响应式的属性对象
            this.props = observable.object<Record<string, unknown>>({});
            // @ts-ignore 2.创建实例
            this.instance = new factory(this.props);
            this.safeRunLifeCycle("onBeforeMount");
            const root = this.attachShadow({ mode: "closed" });
            const styleEl = document.createElement("style");
            root.append(styleEl);
            // 4. 通过mobx 执行刷新渲染的逻辑
            autorun(() => {
                // 如果组件已经挂载完毕
                if (Component.isMounted) {
                    this.safeRunLifeCycle("onBeforeUpdate");
                }
                // 通过lit-html的render将生成的模板html渲染到根节点
                render(this.instance.render(this.props), root);
                styleEl.textContent = this.instance.style();
                // 渲染完之后，如果挂载完成 执行更新生命周期函数
                if (Component.isMounted) {
                    this.safeRunLifeCycle("onUpdated");
                } else {
                    // 执行完render 将isMounted置为true
                    Component.isMounted = true;
                }
            });
        }

        private handleComponentFactory() {
            // 1. 创建一个响应式的属性对象
            this.props = observable.object<Record<string, unknown>>({});
            // 2. 将属性传递给工厂函数得到模板函数
            const template = (factory as IFactory).call(this, this.props);
            // 执行挂载前的生命周期钩子
            each<TLifeCycle>(this.onBeforeMount, (cb) => cb());
            // 3.创建一个影子根节点
            const root = this.attachShadow({ mode: "closed" });
            const styleEl = document.createElement("style");
            root.append(styleEl);
            // 4. 通过mobx 执行刷新渲染的逻辑
            autorun(() => {
                // 如果组件已经挂载完毕
                if (Component.isMounted) {
                    each<TLifeCycle>(this.onBeforeUpdate, (cb) => cb());
                }
                // 通过lit-html的render将生成的模板html渲染到根节点
                render(template(), root);
                this.cssList &&
                    each(this.cssList, (css) => {
                        const css_text = isFunction(css) ? css() : css;
                        if (styleEl.textContent!?.indexOf(css_text) < 0) {
                            styleEl.textContent += css_text;
                        }
                    });
                // styleEl.textContent =
                // 渲染完之后，如果挂载完成 执行更新生命周期函数
                if (Component.isMounted) {
                    each<TLifeCycle>(this.onUpdated, (cb) => cb());
                } else {
                    // 执行完render 将isMounted置为true
                    Component.isMounted = true;
                }
            });
        }

        connectedCallback() {
            if (!isClazz) {
                each<TLifeCycle>(this.onMounted, (cb) => cb());
            } else {
                this.safeRunLifeCycle("onMounted");
            }
        }

        disconnectedCallback() {
            if (!isClazz) {
                each<TLifeCycle>(this.onUnmounted, (cb) => cb());
            } else {
                this.safeRunLifeCycle("onUnmounted");
            }
        }
        /**
         * 每当元素的属性变化时，attributeChangedCallback()回调函数会执行
         * @param name
         * @param oldValue
         * @param newValue
         */
        attributeChangedCallback(
            name: string,
            _oldValue: unknown,
            newValue: unknown,
        ) {
            this.props[name] = newValue;
        }
    }
    customElements.define(componentName, Component);
}

export function useLifeCycle(name: TLifeCycleName) {
    return (cb: TLifeCycle) => {
        // @ts-ignore
        if (!this[name]) {
            // @ts-ignore
            this[name] = [];
        }
        // @ts-ignore
        this[name].push(cb);
    };
}

export function useStyleCss() {
    return (cssContent: string | (() => string)) => {
        // @ts-ignore
        if (!this["cssList"]) {
            // @ts-ignore
            this["cssList"] = [];
        }
        // @ts-ignore
        this["cssList"].push(cssContent);
    };
}
