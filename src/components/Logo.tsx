import logo from "../assets/logo.jpeg";

const Logo = () => {
   return (
      <img
         src={logo}
         alt="OpenCash Logo"
         className=" object-cover rounded-lg w-35 h-8"
      />
   );
};

export default Logo;
