import { css, CSSResult } from 'lit'

export const flexStyles: CSSResult = css`
	.layout {
		display: flex;
	}
	.layout.v {
		flex-direction: column;
	}
	.layout.h {
		flex-direction: row;
	}
	.layout.items-center {
		align-items: center;
	}
	.layout.justify-center {
		justify-content: center;
	}
	.layout.justify-end {
		justify-content: flex-end;
	}
	.layout.wrap {
		flex-wrap: wrap;
	}
	.layout > .flex {
		flex: 1;
	}
	.fit {
		width: 100%;
		height: 100%;
	}
	.scroll {
		overflow: auto;
	}
`
