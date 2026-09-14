export class Readable {
  static isDist = false;
}
export class Writable {}
export class Duplex {}
export class Transform {}

const stream = {
  Readable,
  Writable,
  Duplex,
  Transform
};

export default stream;
