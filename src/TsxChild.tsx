import { defineComponent } from "vue";
export default defineComponent({
    props: {
        name: String
    },
    setup(props) {
        return () => (
            <>
                <h2>Hello! {props.name} (from tsx child)</h2>
            </>
        );
    }
});
