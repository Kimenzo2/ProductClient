<script lang="ts">
	import logo from '$lib/assets/productclient-logo.svg';

	type Props = {
		size?: number;
		alt?: string;
		class?: string;
	};

	let { size = 32, alt = '', class: className = '' }: Props = $props();
</script>

<img src={logo} alt={alt} width={size} height={size} class={`block shrink-0 ${className}`} draggable="false" />
