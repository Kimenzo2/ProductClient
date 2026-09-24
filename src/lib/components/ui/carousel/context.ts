import { getContext, setContext } from 'svelte';
import type { Writable } from 'svelte/store';
import type { EmblaCarouselType, EmblaOptionsType, EmblaPluginType } from 'embla-carousel';

export type CarouselApi = EmblaCarouselType;
export type CarouselOptions = EmblaOptionsType;
export type CarouselPlugin = EmblaPluginType;
export type CarouselOrientation = 'horizontal' | 'vertical';

export type CarouselContext = {
	orientation: CarouselOrientation;
	api: Writable<CarouselApi | undefined>;
	canScrollPrev: Writable<boolean>;
	canScrollNext: Writable<boolean>;
	opts: CarouselOptions | undefined;
	plugins: CarouselPlugin[] | undefined;
	scrollPrev: () => void;
	scrollNext: () => void;
	onInit: (api: CarouselApi) => void;
};

const KEY = Symbol('carousel');

export function setCarouselContext(ctx: CarouselContext): void {
	setContext(KEY, ctx);
}

export function getCarouselContext(): CarouselContext {
	return getContext<CarouselContext>(KEY);
}

// React-style alias for familiarity with @kobra/carousel
export const useCarousel = getCarouselContext;
