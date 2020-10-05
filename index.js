const canvas = document.getElementById("myCanvas");
const context = canvas.getContext("2d");

//html elements
const alphaSlider = document.getElementById("alpha-slider");
const pSlider = document.getElementById("p-slider");
const nSlider = document.getElementById("n-slider");
const alphaLabel = document.getElementById("alpha-label");
const pLabel = document.getElementById("p-label");
const trueButton = document.getElementById("null-true-button");
const falseButton = document.getElementById("null-false-button");
const trueLabel = document.getElementById("null-true-text");
const falseLabel = document.getElementById("null-false-text");

//drawing variables
const resolution = 150; //the number of points that a normal distrubition is composed of
const yScale = 40;

//control variables
let alpha = 0.3; //the cutoff point for rejecting/failing to reject the null hypothesis
let p = 0.8; //the center for the actual sampling distribution
let sd = 0.0313; //the standard deviation of the sample distributions
let nullTrue = true; //is the null hypothesis correct

const buddy = new Image();
buddy.src = "./buddy.png";

const setup = () => {
	updateAlpha();
	updateP();
	updateStdDev();
	updateProbablilites();

	draw();
};

const draw = () => {
	//clear the canvas
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = "white";
	context.fillRect(0, 0, canvas.width, canvas.height);

	//draw the two normal models
	drawNormal(0.5, sd, "#2a6bbf", true); //draw the null hypothesis
	const maxHeight = drawNormal(p, sd, "#62b851", false); //draw the sampling distribution

	context.fillStyle = "black";
	context.textAlign = "center";
	//draw the alpha and beta labels
	if (p < 0.5) {
		context.font = "20px Times New Roman";
		context.fontWeight = "bold";
		context.fillText("β", canvas.width * (1 - alpha) + 16, canvas.height - 6);
		context.font = "24px Times New Roman";
		context.fontWeight = "normal";
		context.fillText("α", canvas.width * (1 - alpha) - 16, canvas.height - 6);
	} else {
		context.font = "20px Times New Roman";
		context.fontWeight = "bold";
		context.fillText("β", canvas.width * (1 - alpha) - 16, canvas.height - 6);
		context.font = "24px Times New Roman";
		context.fontWeight = "normal";
		context.fillText("α", canvas.width * (1 - alpha) + 16, canvas.height - 6);
	}

	let sign = 1;
	if (p < 0.5) {
		sign = -1;
	}
	//draw OK label
	context.font = "22px Times New Roman";
	context.fontWeight = "bold";
	if ((alpha < 0.46 && sign === 1) || (alpha > 0.54 && sign === -1)) {
		context.fillText("OK", canvas.width / 2, canvas.height - maxHeight + 30);
	} else {
		context.fillText("OK", canvas.width * (1 - alpha) - 24 * sign, canvas.height - maxHeight + 30);
		context.lineWidth = 1;
		context.strokeStyle = "black";
		context.beginPath();
		context.moveTo(canvas.width * (1 - alpha) - 24 * sign, canvas.height - maxHeight + 34);
		context.lineTo(canvas.width * (1 - alpha) - 24 * sign, canvas.height - 36);
		if ((alpha < 0.7 && sign === 1) || (alpha > 0.3 && sign === -1)) {
			context.lineTo(canvas.width * (1 - alpha) - 10 * sign, canvas.height - 24);
		} else {
			context.lineTo(canvas.width * (1 - alpha) - 30 * sign, canvas.height - 5);
		}
		context.stroke();
	}

	//draw power label
	context.font = "18px Times New Roman";
	context.fontWeight = "bold";
	if ((1 - alpha < p - 0.07 && sign === 1) || (1 - alpha > p + 0.07 && sign === -1)) {
		context.fillText("Power", canvas.width * p, canvas.height - maxHeight + 50);
	} else {
		context.fillText("Power", canvas.width * (1 - alpha) + 34 * sign, canvas.height - maxHeight + 50);
		if (maxHeight > 90) {
			context.lineWidth = 1;
			context.strokeStyle = "black";
			context.beginPath();
			context.moveTo(canvas.width * (1 - alpha) + 34 * sign, canvas.height - maxHeight + 55);
			context.lineTo(canvas.width * (1 - alpha) + 34 * sign, canvas.height - 36);
			if ((1 - alpha < p + 0.2 && sign === 1) || (1 - alpha > p - 0.2 && sign === -1)) {
				context.lineTo(canvas.width * (1 - alpha) + 14 * sign, canvas.height - 24);
			} else {
				context.lineTo(canvas.width * (1 - alpha) + 40 * sign, canvas.height - 5);
			}
			context.stroke();
		}
	}
};

const drawNormal = (mean, stdDev, color, typeOne) => {
	context.strokeStyle = color;
	context.fillStyle = color + "80";
	context.lineWidth = 2;

	const firstHalf = 1 / (stdDev * Math.sqrt(2 * Math.PI));

	const divide = 1 - alpha;
	const divideY = normalCurve(divide, firstHalf, mean, stdDev);
	const maxHeight = normalCurve(p, firstHalf, mean, stdDev);

	context.beginPath();
	for (let t = 0; t <= resolution; t++) {
		//calculate the x and y coordinate of this normal step
		const x = t / resolution;
		const y = normalCurve(x, firstHalf, mean, stdDev);

		//draw the step of the line
		context.lineTo(x * canvas.width, canvas.height - y - 2);

		//determine whether we've just crossed alpha
		const lastX = (t - 1) / resolution;
		if (x >= divide && lastX < divide) {
			//shade in left half of graph
			context.stroke();
			context.lineTo(divide * canvas.width, canvas.height - divideY - 2);
			context.lineTo(divide * canvas.width, canvas.height);
			context.lineTo(0, canvas.height);

			if ((typeOne && p > 0.5) || (!typeOne && p <= 0.5)) {
				//if okay or power
				context.fill();
			} else if (!typeOne && p > 0.5) {
				//if type two error
				drawBeta(maxHeight, divide, stdDev, -1);
			} else if (typeOne && p <= 0.5) {
				//if type one error
				context.fillStyle = "#db464680";
				context.fill();
			}
			context.fillStyle = color + "80";
			context.beginPath();
			context.moveTo(divide * canvas.width, canvas.height - divideY - 2);
		}
	}
	context.stroke();

	//shade in right half of graph
	context.lineTo(canvas.width, canvas.height);
	context.lineTo(divide * canvas.width, canvas.height);
	if ((!typeOne && p > 0.5) || (typeOne && p <= 0.5)) {
		//if okay or power
		context.fill();
	} else if (typeOne && p > 0.5) {
		//if type one error
		context.fillStyle = "#db464680";
		context.fill();
	} else if (!typeOne && p <= 0.5) {
		//if type two error
		drawBeta(maxHeight, divide, stdDev, 0);
	}

	return maxHeight;
};

const normalCurve = (x, firstHalf, mean, stdDev) => {
	//calculate y coordinate for point on normal curve as a function of x
	const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
	const secondHalf = Math.pow(Math.E, exponent);
	return firstHalf * secondHalf * yScale;
};

const drawBeta = (maxHeight, divide, stdDev, sign) => {
	//draw good ole BJ geoge
	context.save();
	context.clip();
	context.globalAlpha = 0.8;
	context.drawImage(
		buddy,
		0,
		0,
		172,
		146,
		canvas.width * (divide + sign * 4 * stdDev),
		canvas.height - maxHeight - 3,
		4 * stdDev * canvas.width,
		maxHeight + 3
	);
	context.globalAlpha = 1;
	context.restore();
	context.fillStyle = "#db464680";
	context.fill();
};

const updateAlpha = () => {
	//update alpha level from slider
	const newAlpha = 1 - alphaSlider.value / 1000;
	if (alpha !== newAlpha) {
		alphaLabel.style.left = Math.floor(alphaSlider.value * 0.5) + "px";
		alpha = newAlpha;
		draw();
	}
	updateProbablilites();
};

const updateP = () => {
	//update center of green normal model from slider
	const newP = pSlider.value / 1000;
	if (p !== newP) {
		pLabel.style.left = Math.floor(pSlider.value * 0.5) + "px";
		p = newP;
		draw();
	}
	updateProbablilites();
};

const updateStdDev = () => {
	//recalculate standard deviation from new sample size
	const n = 5 + nSlider.value * 0.075;
	const newSd = Math.sqrt(0.25 / n);
	if (newSd !== sd) {
		sd = newSd;
		draw();
	}
	updateProbablilites();
};

const updateProbablilites = () => {
	//update probabilities of error types
	if (nullTrue) {
		let alphaProb = normalCDF(1 - alpha, 0.5, sd);
		if (p < 0.5) {
			alphaProb = 1 - alphaProb;
		}
		trueLabel.innerHTML = "H<sub>0</sub> is true, P(Type I Error) = α = " + alphaProb.toFixed(3);
		falseLabel.innerHTML = "H<sub>0</sub> is false, P(Type II Error) = 0";
	} else {
		let beta = normalCDF(alpha, p, sd);
		if (p < 0.5) {
			beta = 1 - beta;
		}
		trueLabel.innerHTML = "H<sub>0</sub> is true, P(Type I Error) = 0";
		falseLabel.innerHTML = "H<sub>0</sub> is false, P(Type II Error) = β = " + beta.toFixed(3);
	}
};

const normalCDF = (x, mean, stdDev) => {
	//calculate probability of getting a certain x coordinate or more extreme
	const z = (1 - x - mean) / stdDev;
	const t = 1 / (1 + 0.2315419 * Math.abs(z));
	const d = 0.3989423 * Math.exp((-z * z) / 2);
	let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
	if (z > 0) {
		prob = 1 - prob;
	}
	return prob;
};

alphaSlider.onchange = () => {
	updateAlpha();
};
alphaSlider.onmousemove = () => {
	updateAlpha();
};

pSlider.onchange = () => {
	updateP();
};
pSlider.onmousemove = () => {
	updateP();
};

nSlider.onchange = () => {
	updateStdDev();
};
nSlider.onmousemove = () => {
	updateStdDev();
};
trueButton.onclick = () => {
	nullTrue = true;
	trueButton.style.backgroundColor = "#2a6bbf";
	falseButton.style.backgroundColor = "#c9c9c9";
	updateProbablilites();
};
falseButton.onclick = () => {
	nullTrue = false;
	trueButton.style.backgroundColor = "#c9c9c9";
	falseButton.style.backgroundColor = "#62b851";
	updateProbablilites();
};

buddy.onload = setTimeout(draw, 400);
window.onload = setup();
